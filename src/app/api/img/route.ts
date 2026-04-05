import { type NextRequest, NextResponse } from "next/server";

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

/**
 * GET /api/img?url=<encoded-https-url>
 *
 * Server-side image proxy for external HTTPS sources. Fetches from the origin
 * server-to-server, avoiding:
 *  - CORS blocks on R2 buckets and CDNs that lack Access-Control-Allow-Origin headers
 *  - Vercel image optimizer quota (/_next/image 402 errors on free plan)
 *
 * Cached aggressively at the CDN layer — repeat requests for the same URL
 * are served from edge cache without invoking the function.
 */
export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("url");

  if (!raw) {
    return NextResponse.json({ error: "Missing url" }, { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return NextResponse.json({ error: "Invalid url" }, { status: 400 });
  }

  if (parsed.protocol !== "https:") {
    return NextResponse.json({ error: "Only https URLs allowed" }, { status: 400 });
  }

  let upstream: Response;
  try {
    upstream = await fetch(parsed.toString(), {
      next: { revalidate: 3600 },
    });
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

  const body = await upstream.arrayBuffer();

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
