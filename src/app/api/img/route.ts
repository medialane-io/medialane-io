import { type NextRequest, NextResponse } from "next/server";
import { lookup } from "node:dns/promises";
import { readBodyWithCap } from "@/lib/proxy-body";
import { createRateLimiter, requestIp } from "@/lib/api-route-guard";

const ALLOWED_CONTENT_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  "image/avif",
  "image/bmp",
  "image/tiff",
]);

const MAX_REDIRECTS = 5;

const MAX_BYTES = 15 * 1024 * 1024;

const checkRateLimit = createRateLimiter(60_000, 300);

function isPrivateHost(hostname: string): boolean {
  const h = hostname.toLowerCase().replace(/^\[|\]$/g, "");

  if (h === "localhost" || h === "127.0.0.1" || h === "0.0.0.0") return true;

  if (/^\d+$/.test(h)) {
    const n = parseInt(h, 10);
    if (
      n === 2130706433 ||
      n === 0 ||
      (n >= 0xac100000 && n <= 0xac1fffff) ||
      (n >= 0xc0a80000 && n <= 0xc0a8ffff) ||
      (n >= 0x0a000000 && n <= 0x0affffff) ||
      (n >= 0xa9fe0000 && n <= 0xa9feffff)
    ) return true;
  }

  if (/^0x[0-9a-f]+$/i.test(h)) {
    const n = parseInt(h, 16);
    if (
      n === 0x7f000001 ||
      n === 0 ||
      (n >= 0xac100000 && n <= 0xac1fffff) ||
      (n >= 0xc0a80000 && n <= 0xc0a8ffff) ||
      (n >= 0x0a000000 && n <= 0x0affffff) ||
      (n >= 0xa9fe0000 && n <= 0xa9feffff)
    ) return true;
  }

  if (/^0\d+\.\d+\.\d+\.\d+$/.test(h)) return true;

  if (h === "::1" || /^0*:0*:0*:0*:0*:0*:0*:0*1$/.test(h)) return true;

  const v4mapped = h.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/i);
  if (v4mapped) return isPrivateHost(v4mapped[1]);

  if (/^10\./.test(h)) return true;
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(h)) return true;
  if (/^192\.168\./.test(h)) return true;
  if (/^169\.254\./.test(h)) return true;
  if (/^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./.test(h)) return true;

  if (/^fe80:/i.test(h)) return true;
  if (/^f[cd][0-9a-f]{2}:/i.test(h)) return true;

  if (h.endsWith(".local")) return true;
  if (h === "metadata.google.internal") return true;
  if (h === "metadata.azure.internal") return true;

  return false;
}

async function resolvesToPrivateHost(hostname: string): Promise<boolean> {

  try {
    const records = await lookup(hostname, { all: true });
    if (records.length === 0) return true;
    return records.some((r) => isPrivateHost(r.address));
  } catch {
    return true;
  }
}

function validateUrl(raw: string): { url: URL } | { error: string; status: number } {
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return { error: "Invalid url", status: 400 };
  }

  if (parsed.protocol !== "https:") {
    return { error: "Only https URLs allowed", status: 400 };
  }

  if (parsed.username || parsed.password) {
    return { error: "URL credentials not allowed", status: 400 };
  }

  if (isPrivateHost(parsed.hostname)) {
    return { error: "URL not allowed", status: 400 };
  }

  return { url: parsed };
}

async function safeFetch(url: URL, hopsLeft: number): Promise<Response> {
  if (hopsLeft < 0) throw new Error("Too many redirects");

  if (await resolvesToPrivateHost(url.hostname)) {
    throw new Error("Blocked: hostname resolves to a private address");
  }

  const res = await fetch(url.toString(), {
    redirect: "manual",
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; Medialane/1.0; +https://www.medialane.io)",
    },
  });

  if (res.status >= 300 && res.status < 400) {
    const location = res.headers.get("location");
    if (!location) throw new Error("Redirect with no Location header");

    const next = new URL(location, url);
    const validated = validateUrl(next.toString());
    if ("error" in validated) throw new Error(`Redirect blocked: ${validated.error}`);

    return safeFetch(validated.url, hopsLeft - 1);
  }

  return res;
}

export async function GET(req: NextRequest) {
  if (!checkRateLimit(requestIp(req))) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const raw = req.nextUrl.searchParams.get("url");

  if (!raw) {
    return NextResponse.json({ error: "Missing url" }, { status: 400 });
  }

  const validated = validateUrl(raw);
  if ("error" in validated) {
    return NextResponse.json({ error: validated.error }, { status: validated.status });
  }

  let upstream: Response;
  try {
    upstream = await safeFetch(validated.url, MAX_REDIRECTS);
  } catch {
    return NextResponse.json({ error: "Failed to fetch image" }, { status: 502 });
  }

  if (!upstream.ok) {
    return NextResponse.json(
      { error: `Upstream returned ${upstream.status}` },
      { status: upstream.status }
    );
  }

  const contentType = upstream.headers.get("content-type") ?? "";
  const baseType = contentType.split(";")[0].trim().toLowerCase();

  if (!ALLOWED_CONTENT_TYPES.has(baseType)) {
    return NextResponse.json({ error: "Not an image" }, { status: 400 });
  }

  const capped = await readBodyWithCap(upstream, MAX_BYTES);
  if (!capped.ok) {
    return NextResponse.json({ error: capped.error }, { status: capped.status });
  }

  return new NextResponse(capped.body, {
    status: 200,
    headers: {
      "Content-Type": contentType,

      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; img-src 'self' data:; style-src 'unsafe-inline'; sandbox",

      "Cache-Control": "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
