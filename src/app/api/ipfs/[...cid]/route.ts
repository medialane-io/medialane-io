import { type NextRequest, NextResponse } from "next/server";
import { readBodyWithCap } from "@/lib/proxy-body";

const PINATA_JWT = process.env.PINATA_JWT;
const DEDICATED_GATEWAY = process.env.PINATA_DEDICATED_GATEWAY;
const PUBLIC_GATEWAY = "https://gateway.pinata.cloud";

// Reasonable ceiling for a proxied thumbnail request — this route is public,
// so cap what a caller can ask a paid-tier Pinata gateway to render.
const MAX_WIDTH = 2000;

// Cap the proxied body. The route is public and CID content is arbitrary
// size, so an unbounded `arrayBuffer()` lets any caller pin server memory by
// requesting a large pinned file. 25 MB covers the largest legit upload
// (20 MB document) with headroom; images/metadata are far smaller.
const MAX_BYTES = 25 * 1024 * 1024;

// Per-IP rate limit — the route has no session to gate on (wallet-native has
// no server session), so this bounds abuse of the paid dedicated gateway.
// Per-process (Vercel lambdas don't share memory); acceptable for cost-drain
// protection, not correctness.
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 300;
const ipCounts = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = ipCounts.get(ip);
  if (!entry || now >= entry.resetAt) {
    ipCounts.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) return false;
  entry.count += 1;
  return true;
}

/**
 * GET /api/ipfs/[...cid]?w=<width>
 *
 * Server-side IPFS proxy. Uses the dedicated Pinata gateway with JWT when
 * configured (better rate limits), falling back to the public gateway
 * otherwise. Public route — every visitor gets the same treatment; per-IP
 * rate limiting is what bounds abuse (see above).
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
 * domain (confirmed in prod: unauthenticated requests 401), so resize is
 * only attempted when a dedicated gateway + JWT are configured — otherwise
 * every caller gets the unresized original via `/ipfs/{cid}`, never a 401.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ cid: string[] }> }
) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

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

  const useDedicated = !!DEDICATED_GATEWAY && !!PINATA_JWT;
  const gateway = useDedicated ? DEDICATED_GATEWAY : PUBLIC_GATEWAY;

  const headers: HeadersInit = {};
  if (useDedicated) {
    headers["Authorization"] = `Bearer ${PINATA_JWT}`;
  }

  const width = Number.parseInt(req.nextUrl.searchParams.get("w") ?? "", 10);
  const wantsResize = useDedicated && Number.isFinite(width) && width > 0 && width <= MAX_WIDTH;

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

  // Allowlist safe MIME-type prefixes; anything else (text/html,
  // text/javascript, …) is served as `application/octet-stream` so it can't
  // render as a scriptable document. SVG is allowed to keep its type so it
  // renders as image artwork, but the CSP below (`sandbox` = opaque origin,
  // no scripts) neutralises the direct-navigation XSS that an inline SVG
  // would otherwise allow on this same-origin proxy.
  const upstreamContentType = upstream.headers.get("content-type") ?? "";
  const SAFE_PREFIXES = [
    "image/jpeg", "image/png", "image/gif", "image/webp", "image/avif", "image/svg+xml",
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
      // Neutralise scripts if this response is ever opened as a top-level
      // document (e.g. an SVG navigated to directly): `sandbox` gives it a
      // unique opaque origin with no script execution. Harmless for images/
      // media loaded via <img>/<video> (CSP doesn't apply to subresources).
      "Content-Security-Policy": "default-src 'none'; img-src 'self' data:; style-src 'unsafe-inline'; sandbox",
      // IPFS content is immutable by CID — safe to cache at the CDN edge
      // (s-maxage) across all visitors, not just the requesting browser.
      "Cache-Control": "public, max-age=31536000, s-maxage=31536000, immutable",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
