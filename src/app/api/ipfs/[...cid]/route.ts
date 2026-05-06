import { auth } from "@clerk/nextjs/server";
import { type NextRequest, NextResponse } from "next/server";

const PINATA_JWT = process.env.PINATA_JWT;
const DEDICATED_GATEWAY = process.env.PINATA_DEDICATED_GATEWAY;
const PUBLIC_GATEWAY = "https://gateway.pinata.cloud";

/**
 * GET /api/ipfs/[...cid]
 *
 * Server-side IPFS proxy. For authenticated users, uses the dedicated
 * Pinata gateway with JWT for better rate limits. For anonymous users,
 * falls back to the public gateway without forwarding credentials.
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

  const { userId } = await auth();
  const isAuthenticated = !!userId;

  // Only attach PINATA_JWT and use the dedicated gateway for authenticated users.
  // Anonymous users use the public gateway without credentials.
  const gateway = isAuthenticated && DEDICATED_GATEWAY
    ? DEDICATED_GATEWAY
    : PUBLIC_GATEWAY;

  const headers: HeadersInit = {};
  if (isAuthenticated && PINATA_JWT) {
    headers["Authorization"] = `Bearer ${PINATA_JWT}`;
  }

  const url = `${gateway}/ipfs/${cidPath}`;

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
      // IPFS content is immutable by CID. Authenticated responses must not be
      // shared by CDN caches since they were fetched with service credentials.
      "Cache-Control": isAuthenticated
        ? "private, max-age=31536000, immutable"
        : "public, max-age=31536000, immutable",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
