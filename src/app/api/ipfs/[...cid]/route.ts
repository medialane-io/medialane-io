import { type NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { readBodyWithCap } from "@/lib/proxy-body";
import { createRateLimiter, requestIp } from "@/lib/api-route-guard";
import { MEDIALANE_BACKEND_URL, MEDIALANE_API_KEY } from "@/lib/constants";

export const runtime = "nodejs";

const MAX_BYTES = 25 * 1024 * 1024;
const MAX_RESIZE_WIDTH = 640;
const RESIZABLE_TYPES = new Set(["image/jpeg", "image/png", "image/gif", "image/webp", "image/avif"]);

const checkRateLimit = createRateLimiter(60_000, 300);

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ cid: string[] }> }
) {
  const ip = requestIp(req);
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const { cid: segments } = await params;
  const cidPath = segments.join("/");

  if (!/^(Qm[1-9A-HJ-NP-Za-km-z]{44,}|b[a-z2-7]{58,})(\/[\w.\-/]*)?$/.test(cidPath)) {
    return NextResponse.json({ error: "Invalid IPFS path" }, { status: 400 });
  }

  if (cidPath.split("/").includes("..")) {
    return NextResponse.json({ error: "Invalid IPFS path" }, { status: 400 });
  }

  const url = `${MEDIALANE_BACKEND_URL.replace(/\/$/, "")}/v1/metadata/image/${cidPath}`;

  let upstream: Response;
  try {
    upstream = await fetch(url, {
      headers: { "x-api-key": MEDIALANE_API_KEY },
      signal: AbortSignal.timeout(18_000),
      next: { revalidate: 86400 },
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch from IPFS" }, { status: 502 });
  }

  if (!upstream.ok) {
    return NextResponse.json(
      { error: `IPFS gateway returned ${upstream.status}` },
      { status: upstream.status }
    );
  }

  const upstreamContentType = upstream.headers.get("content-type") ?? "";
  const SAFE_PREFIXES = [
    "image/jpeg", "image/png", "image/gif", "image/webp", "image/avif", "image/svg+xml",
    "video/", "audio/", "model/", "font/", "application/json", "application/octet-stream",
  ];
  const contentType = SAFE_PREFIXES.some((p) => upstreamContentType.startsWith(p))
    ? upstreamContentType
    : "application/octet-stream";

  const capped = await readBodyWithCap(upstream, MAX_BYTES);
  if (!capped.ok) {
    return NextResponse.json({ error: capped.error }, { status: capped.status });
  }

  const width = Number.parseInt(req.nextUrl.searchParams.get("w") ?? "", 10);
  const wantsResize = Number.isFinite(width) && width > 0 && RESIZABLE_TYPES.has(contentType);

  let body: Uint8Array = capped.body;
  let outContentType = contentType;
  if (wantsResize) {
    try {
      body = await sharp(capped.body)
        .resize({ width: Math.min(width, MAX_RESIZE_WIDTH), withoutEnlargement: true, fit: "inside" })
        .webp({ quality: 78 })
        .toBuffer();
      outContentType = "image/webp";
    } catch {
      body = capped.body;
      outContentType = contentType;
    }
  }

  return new NextResponse(new Uint8Array(body), {
    status: 200,
    headers: {
      "Content-Type": outContentType,
      "X-Content-Type-Options": "nosniff",

      "Content-Security-Policy": "default-src 'none'; img-src 'self' data:; style-src 'unsafe-inline'; sandbox",

      "Cache-Control": "public, max-age=31536000, s-maxage=31536000, immutable",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
