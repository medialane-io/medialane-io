import { type NextRequest, NextResponse } from "next/server";
import { lookup } from "node:dns/promises";
import { readBodyWithCap } from "@/lib/proxy-body";
import {
  createRateLimiter,
  requestIp,
  isPrivateHost,
  validateUrl,
  ALLOWED_IMAGE_CONTENT_TYPES,
  MAX_IMAGE_REDIRECTS,
  MAX_IMAGE_PROXY_BYTES,
} from "@medialane/sdk";

const checkRateLimit = createRateLimiter(60_000, 300);

async function resolvesToPrivateHost(hostname: string): Promise<boolean> {

  try {
    const records = await lookup(hostname, { all: true });
    if (records.length === 0) return true;
    return records.some((r) => isPrivateHost(r.address));
  } catch {
    return true;
  }
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
    upstream = await safeFetch(validated.url, MAX_IMAGE_REDIRECTS);
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

  if (!ALLOWED_IMAGE_CONTENT_TYPES.has(baseType)) {
    return NextResponse.json({ error: "Not an image" }, { status: 400 });
  }

  const capped = await readBodyWithCap(upstream, MAX_IMAGE_PROXY_BYTES);
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
