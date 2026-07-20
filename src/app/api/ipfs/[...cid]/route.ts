import { auth } from "@clerk/nextjs/server";
import { type NextRequest, NextResponse } from "next/server";
import { readBodyWithCap } from "@/lib/proxy-body";

const PINATA_JWT = process.env.PINATA_JWT;
const DEDICATED_GATEWAY = process.env.PINATA_DEDICATED_GATEWAY;
const PUBLIC_GATEWAY = "https://gateway.pinata.cloud";

// Reasonable ceiling for a proxied thumbnail request — this route is public
// (no Clerk gate on the query param), so cap what a caller can ask a
// paid-tier Pinata gateway to render.
const MAX_WIDTH = 2000;

// Cap the proxied body. The route is public and CID content is arbitrary
// size, so an unbounded `arrayBuffer()` lets any caller pin server memory by
// requesting a large pinned file. 25 MB covers the largest legit upload
// (20 MB document) with headroom; images/metadata are far smaller.
const MAX_BYTES = 25 * 1024 * 1024;

/**
 * GET /api/ipfs/[...cid]?w=<width>
 *
 * Server-side IPFS proxy. For authenticated users, uses the dedicated
 * Pinata gateway with JWT for better rate limits. For anonymous users,
 * falls back to the public gateway without forwarding credentials.
 *
 * Supports paths: /api/ipfs/QmXxx  and  /api/ipfs/QmXxx/image.png
 *
 * Optional `w` query param requests an on-the-fly resized/re-encoded
 * rendition via Pinata's gateway image optimization (`img-width` etc,
 * only documented on the `/files/{cid}` path — not the classic `/ipfs/{cid}`
 * one). Callers should only pass `w` for known-small display slots
 * (avatars, thumbnails) — omit it to get the original file untouched.
 *
 * `/files/{cid}` requires a Pinata auth token even on the "public" gateway
 * domain (confirmed in prod: anonymous requests 401). Since anonymous
 * requests never carry `PINATA_JWT` by design, resize is only attempted for
 * authenticated requests on the dedicated gateway — anonymous callers always
 * get the unresized original via `/ipfs/{cid}`, never a 401.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ cid: string[] }> }
) {
  const { cid: segments } = await params;
  const cidPath = segments.join("/");

  // Validate CID format — CIDv0 (Qm...) or CIDv1 (bafy..., bafk..., etc.)
  // Optional sub-path after the CID (letters, digits, dots, dashes, underscores, slashes)
  if (!/^(Qm[1-9A-HJ-NP-Za-km-z]{44,}|b[a-z2-7]{58,})(\/[\w.\-/]*)?$/.test(cidPath)) {
    return NextResponse.json({ error: "Invalid IPFS path" }, { status: 400 });
  }
  // The sub-path grammar allows dots, so guard against `..` traversal segments
  // escaping the gateway's /ipfs/ path (the host stays fixed, but no reason to
  // forward a traversal to Pinata with our JWT attached).
  if (cidPath.split("/").includes("..")) {
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

  const width = Number.parseInt(req.nextUrl.searchParams.get("w") ?? "", 10);
  const canResize = isAuthenticated && !!DEDICATED_GATEWAY && !!PINATA_JWT;
  const wantsResize = canResize && Number.isFinite(width) && width > 0 && width <= MAX_WIDTH;

  // Optimization params are only documented on `/files/{cid}`; leave every
  // other (unresized) caller on the classic `/ipfs/{cid}` path unchanged.
  const url = new URL(`${gateway}/${wantsResize ? "files" : "ipfs"}/${cidPath}`);
  if (wantsResize) {
    url.searchParams.set("img-width", String(width));
    url.searchParams.set("img-fit", "cover");
    url.searchParams.set("img-format", "auto");
    url.searchParams.set("img-quality", "80");
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

  // Allowlist safe MIME-type prefixes — force `application/octet-stream` for
  // scriptable types (image/svg+xml, text/html, text/javascript, …) so a
  // malicious pinned file can't execute script in the app origin when opened
  // directly through this same-origin proxy. Paired with `nosniff` below.
  const upstreamContentType = upstream.headers.get("content-type") ?? "";
  const SAFE_PREFIXES = [
    "image/jpeg", "image/png", "image/gif", "image/webp", "image/avif",
    "video/", "audio/", "model/", "font/", "application/json", "application/octet-stream",
  ];
  const contentType = SAFE_PREFIXES.some((p) => upstreamContentType.startsWith(p))
    ? upstreamContentType
    : "application/octet-stream";

  // Cap the body so a large CID can't buffer unbounded (shared with /api/img).
  const capped = await readBodyWithCap(upstream, MAX_BYTES);
  if (!capped.ok) {
    return NextResponse.json({ error: capped.error }, { status: capped.status });
  }

  return new NextResponse(capped.body, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "X-Content-Type-Options": "nosniff",
      // IPFS content is immutable by CID. Authenticated responses must not be
      // shared by CDN caches since they were fetched with service credentials.
      // `s-maxage` (vs browser-only `max-age`) is what lets Vercel's edge
      // cache the anonymous response across *all* visitors, not just the
      // requesting browser — the same CID is served straight from the edge
      // after the first request anywhere, no repeat Pinata round trip.
      "Cache-Control": isAuthenticated
        ? "private, max-age=31536000, immutable"
        : "public, max-age=31536000, s-maxage=31536000, immutable",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
