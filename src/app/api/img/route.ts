import { type NextRequest, NextResponse } from "next/server";
import { lookup } from "node:dns/promises";
import { readBodyWithCap } from "@/lib/proxy-body";

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
// Cap image proxy responses at 15 MB. The endpoint is public (no Clerk
// gate), so an unbounded `arrayBuffer()` lets any caller pin server memory
// by pointing us at a large file. NFT thumbnails are typically <2 MB;
// 15 MB covers high-res hero images with headroom.
const MAX_BYTES = 15 * 1024 * 1024;

/**
 * GET /api/img?url=<encoded-https-url>
 *
 * Server-side image proxy for external HTTPS sources. Fetches from the origin
 * server-to-server, avoiding:
 *  - CORS blocks on R2 buckets and CDNs that lack Access-Control-Allow-Origin headers
 *  - Vercel image optimizer quota (/_next/image 402 errors on free plan)
 *
 * Security:
 *  - Blocks private/link-local/loopback hostnames on every redirect hop (SSRF).
 *  - Rejects URLs with embedded credentials.
 *  - Manual redirect handling — each hop is validated before following.
 *  - Only returns responses with image content-types.
 */

function isPrivateHost(hostname: string): boolean {
  const h = hostname.toLowerCase().replace(/^\[|\]$/g, "");

  // Loopback — standard dotted-decimal
  if (h === "localhost" || h === "127.0.0.1" || h === "0.0.0.0") return true;

  // Decimal encoding: 2130706433 = 127.0.0.1, etc.
  if (/^\d+$/.test(h)) {
    const n = parseInt(h, 10);
    if (
      n === 2130706433 || // 127.0.0.1
      n === 0 ||          // 0.0.0.0
      (n >= 0xac100000 && n <= 0xac1fffff) || // 172.16.0.0/12
      (n >= 0xc0a80000 && n <= 0xc0a8ffff) || // 192.168.0.0/16
      (n >= 0x0a000000 && n <= 0x0affffff) || // 10.0.0.0/8
      (n >= 0xa9fe0000 && n <= 0xa9feffff)    // 169.254.0.0/16 (IMDS)
    ) return true;
  }
  // Hex encoding: 0x7f000001 = 127.0.0.1
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
  // Octal encoding: 0177.0.0.1
  if (/^0\d+\.\d+\.\d+\.\d+$/.test(h)) return true;

  // IPv6 loopback — all spellings
  if (h === "::1" || /^0*:0*:0*:0*:0*:0*:0*:0*1$/.test(h)) return true;

  // IPv4-mapped IPv6 (::ffff:x.x.x.x) — check mapped address
  const v4mapped = h.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/i);
  if (v4mapped) return isPrivateHost(v4mapped[1]);

  // Private IPv4 ranges
  if (/^10\./.test(h)) return true;
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(h)) return true;
  if (/^192\.168\./.test(h)) return true;
  if (/^169\.254\./.test(h)) return true; // link-local / AWS IMDS
  if (/^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./.test(h)) return true; // CGNAT 100.64/10

  // IPv6 link-local, ULA (fc00::/7 covers fc and fd prefixes)
  if (/^fe80:/i.test(h)) return true;
  if (/^f[cd][0-9a-f]{2}:/i.test(h)) return true;

  // .local mDNS + known cloud IMDS hostnames
  if (h.endsWith(".local")) return true;
  if (h === "metadata.google.internal") return true;
  if (h === "metadata.azure.internal") return true;

  return false;
}

/**
 * DNS-resolution SSRF guard. `isPrivateHost` only inspects the literal
 * hostname string — a public-looking name (evil.example) whose A/AAAA record
 * points at an internal address (169.254.169.254, 10.x, …) sails past it.
 * Resolve the name and re-check every returned address by its literal form.
 * Returns true (block) on resolution failure — fail closed.
 *
 * Residual (same as the backend's resolvesToPrivateHost): this is a
 * point-in-time check, not IP-pinned, so a record that changes between here
 * and the fetch (rebinding) isn't caught — full closure needs a connect-time
 * dispatcher, out of scope for the platform fetch.
 */
async function resolvesToPrivateHost(hostname: string): Promise<boolean> {
  // A literal IP was already range-checked in validateUrl → isPrivateHost;
  // resolving it again is unnecessary but harmless. Skip only obvious IPs.
  try {
    const records = await lookup(hostname, { all: true });
    if (records.length === 0) return true;
    return records.some((r) => isPrivateHost(r.address));
  } catch {
    return true; // resolution failed → don't risk it
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

  // Block embedded credentials — https://user:pass@host
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

  // Layer 2 SSRF guard: the hostname passed validateUrl's literal-string
  // check; now confirm it doesn't RESOLVE to a private address. Runs on the
  // initial URL and every redirect hop (both reach here).
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

    // Resolve relative redirects against the current URL
    const next = new URL(location, url);
    const validated = validateUrl(next.toString());
    if ("error" in validated) throw new Error(`Redirect blocked: ${validated.error}`);

    return safeFetch(validated.url, hopsLeft - 1);
  }

  return res;
}

export async function GET(req: NextRequest) {
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

  // Cap the body (declared Content-Length + streaming guard). The chunks are
  // accumulated so we preserve the buffered Cache-Control behaviour the CDN
  // expects; switching to a streaming response would change caching. Shared
  // with /api/ipfs via readBodyWithCap.
  const capped = await readBodyWithCap(upstream, MAX_BYTES);
  if (!capped.ok) {
    return NextResponse.json({ error: capped.error }, { status: capped.status });
  }

  return new NextResponse(capped.body, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      // This route allows image/svg+xml. Neutralise script execution if the
      // response is opened as a top-level document (direct navigation): nosniff
      // stops MIME-sniffing, and the CSP `sandbox` gives it an opaque origin
      // with no scripts. Harmless for images loaded via <img> (CSP doesn't
      // apply to subresources).
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; img-src 'self' data:; style-src 'unsafe-inline'; sandbox",
      // `s-maxage` lets Vercel's edge cache this across all visitors, not just
      // the requesting browser — repeat requests for the same URL are served
      // from the edge instead of re-fetching + re-streaming the origin.
      "Cache-Control": "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
