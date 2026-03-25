import { type NextRequest, NextResponse } from "next/server";

const PINATA_JWT = process.env.PINATA_JWT;
// Dedicated gateway takes precedence; falls back to Pinata public gateway.
// Set PINATA_DEDICATED_GATEWAY in Vercel/Railway to your Pinata dedicated gateway URL.
const GATEWAY =
  process.env.PINATA_DEDICATED_GATEWAY ||
  "https://gateway.pinata.cloud";

/**
 * GET /api/ipfs/[...cid]
 *
 * Server-side IPFS proxy. Fetches content from Pinata using the server-only
 * PINATA_JWT, then streams it back to the browser. This avoids:
 *  - Pinata's Cross-Origin-Resource-Policy: same-origin header on free plans
 *  - Browser-visible rate limit (429) errors from the public gateway
 *  - The need for a dedicated Pinata gateway on the client
 *
 * Supports paths: /api/ipfs/QmXxx  and  /api/ipfs/QmXxx/image.png
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ cid: string[] }> }
) {
  const { cid: segments } = await params;
  const cidPath = segments.join("/");

  // Validate CID format — CIDv0 (Qm...) or CIDv1 (bafy..., bafk..., etc.)
  // Optional sub-path after the CID (letters, digits, dots, dashes, underscores, slashes)
  if (!/^(Qm[1-9A-HJ-NP-Za-km-z]{44,}|b[a-z2-7]{58,})(\/[\w.\-/]*)?$/.test(cidPath)) {
    return NextResponse.json({ error: "Invalid IPFS path" }, { status: 400 });
  }

  const url = `${GATEWAY}/ipfs/${cidPath}`;

  const headers: HeadersInit = {};
  if (PINATA_JWT) {
    headers["Authorization"] = `Bearer ${PINATA_JWT}`;
  }

  let upstream: Response;
  try {
    upstream = await fetch(url, { headers, next: { revalidate: 86400 } });
  } catch {
    return NextResponse.json({ error: "Failed to fetch from IPFS" }, { status: 502 });
  }

  if (!upstream.ok) {
    return NextResponse.json(
      { error: `IPFS gateway returned ${upstream.status}` },
      { status: upstream.status }
    );
  }

  const contentType = upstream.headers.get("content-type") ?? "application/octet-stream";
  const body = await upstream.arrayBuffer();

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      // Cache aggressively — IPFS content is immutable by CID
      "Cache-Control": "public, max-age=31536000, immutable",
      // Allow any origin to embed this content (images, etc.)
      "Access-Control-Allow-Origin": "*",
    },
  });
}
