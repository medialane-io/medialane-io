/**
 * BFF proxy for /v1/* — adds the server-only `MEDIALANE_API_KEY` header
 * and forwards to the Medialane backend. Replaces the previous pattern
 * where client code shipped the API key in the browser bundle via
 * `NEXT_PUBLIC_MEDIALANE_API_KEY`.
 *
 * The SDK client (`src/lib/medialane-client.ts`) targets `/api/proxy`
 * when running in the browser, so SWR hooks like `useCollections`,
 * `useToken`, etc. flow through here automatically. Direct client
 * fetches (launchpad pages, `use-remix-offers`) should also hit
 * `/api/proxy/v1/...` instead of the backend origin.
 *
 * The user's Authorization header (Clerk JWT, if present) is passed
 * through unchanged — the backend still uses it for identity-aware
 * routes (`/v1/users/me`, `/v1/creators/:wallet/profile`, …).
 */
import { type NextRequest, NextResponse } from "next/server";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_MEDIALANE_BACKEND_URL ?? "http://localhost:3001";

// Hop-by-hop headers per RFC 7230 + a few Next.js / Vercel ones that must
// not be forwarded blindly between caller ↔ proxy ↔ origin.
const HOP_BY_HOP_HEADERS = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailers",
  "transfer-encoding",
  "upgrade",
  "host",
  "content-length",
  "accept-encoding",
]);

// ─── Method/path allowlist ────────────────────────────────────────────────
//
// The proxy injects the server-only `MEDIALANE_API_KEY` into every outbound
// request. The key is a fully-privileged tenant key — backend layered auth
// (Clerk JWT, SNIP-12 signatures, on-chain ownership checks) handles the
// real authorisation per route, but defense-in-depth at this boundary
// limits the surface a leaked key or a future backend route addition can
// reach through the io BFF.
//
// Scope rationale (audit `medialane-core/docs/audits/2026-05-25-medialane-io-bff-proxy-auth-audit.md`):
//   - GET requests on /v1/* are ALL allowed — reads are public-equivalent
//     and the audit confirmed there is no admin GET surface on /v1/.
//     The previous per-resource GET enumeration caused a P0 incident
//     (PR #44 → discover-page 403s for /v1/creators) when a new SDK
//     method appeared without a matching pattern. Allowing all GETs
//     prevents that entire class of incident. Postmortem #3 in the plan.
//   - POST/PATCH/DELETE writes are an EXPLICIT enumeration. Any new
//     mutating route requires a corresponding allowlist entry and an io PR.
//
// When adding a new mutating endpoint to the io app, add the (method, regex)
// pair below. Match against the path AFTER the `/v1/` prefix.

const ALLOWED_ROUTES: Record<string, RegExp[]> = {
  // ── Reads (all GET /v1/* allowed) ──────────────────────────────────────
  // Backend has no admin GET routes under /v1 — admin lives at /admin/* on
  // a separate API_SECRET_KEY gate. So a wildcard here is safe.
  GET: [/.+/],
  // ── Mutations (explicit) ───────────────────────────────────────────────
  POST: [
    /^collections\/(register|sync-tx|claim)$/,             // launchpad create + create/collection + on-chain claim
    /^collections\/claim\/request$/,                       // manual-review claim request
    /^collection-slug-claims$/,                            // collection settings slug claim
    /^drop\/conditions$/,                                  // launchpad drop/create (Clerk-gated on backend)
    /^intents\/(listing|offer|counter-offer|fulfill|cancel|mint|create-collection|checkout)$/,  // marketplace + mint flows (signatures gate real auth)
    /^intents\/[^/]+\/hydrate$/,                           // /v1/intents/:id/hydrate (tenant-scoped repair)
    /^metadata\/(upload|upload-file)$/,                    // /v1/metadata/{upload,upload-file}
    /^remix-offers(\/(auto|self\/confirm|[^/]+\/(confirm|reject|extend)))?$/,  // remix offer lifecycle
    /^reports$/,                                           // /v1/reports (Clerk-gated on backend)
    /^users\/(me|register)$/,                              // /v1/users/{me,register} — me also covers upsertMyWallet
    /^username-claims$/,                                   // /v1/username-claims
  ],
  PATCH: [
    /^collections\/[^/]+\/profile$/,                       // updateCollectionProfile (Clerk-gated on backend)
    /^creators\/[^/]+\/profile$/,                          // updateCreatorProfile (Clerk-gated on backend)
    /^intents\/[^/]+\/(confirm|signature)$/,               // /v1/intents/:id/{confirm,signature}
  ],
  // DELETE intentionally empty — no io flow deletes through the proxy.
};

function isPathAllowed(method: string, path: string): boolean {
  const patterns = ALLOWED_ROUTES[method.toUpperCase()];
  if (!patterns) return false;
  return patterns.some((re) => re.test(path));
}

async function handle(
  req: NextRequest,
  ctx: { params: Promise<{ path: string[] }> },
): Promise<NextResponse> {
  const apiKey = process.env.MEDIALANE_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "MEDIALANE_API_KEY is not configured on the server" },
      { status: 500 },
    );
  }

  const { path } = await ctx.params;
  const joinedPath = path.join("/");

  if (!isPathAllowed(req.method, joinedPath)) {
    // Log enough to debug a legitimate route that needs adding to the
    // allowlist — but don't leak the API key path to the response.
    console.warn("[/api/proxy] blocked by allowlist", {
      method: req.method,
      path: joinedPath,
    });
    return NextResponse.json(
      { error: `Path not allowed through io proxy: ${req.method} /v1/${joinedPath}` },
      { status: 403 },
    );
  }

  const target = `${BACKEND_URL.replace(/\/$/, "")}/v1/${joinedPath}${req.nextUrl.search}`;

  // Forward request headers except hop-by-hop + x-api-key (we set our own).
  const fwdHeaders = new Headers();
  for (const [k, v] of req.headers.entries()) {
    const key = k.toLowerCase();
    if (HOP_BY_HOP_HEADERS.has(key) || key === "x-api-key") continue;
    fwdHeaders.set(k, v);
  }
  fwdHeaders.set("x-api-key", apiKey);

  const hasBody = req.method !== "GET" && req.method !== "HEAD";
  const body = hasBody ? await req.arrayBuffer() : undefined;

  const res = await fetch(target, {
    method: req.method,
    headers: fwdHeaders,
    body,
    cache: "no-store",
    redirect: "manual",
  });

  // Forward response headers except hop-by-hop. Keep content-type, cache-
  // control, etc. Strip set-cookie — the backend never sets one for us;
  // anything that appears would be a bug we don't want to surface.
  const outHeaders = new Headers();
  for (const [k, v] of res.headers.entries()) {
    const key = k.toLowerCase();
    if (HOP_BY_HOP_HEADERS.has(key) || key === "set-cookie") continue;
    outHeaders.set(k, v);
  }

  return new NextResponse(res.body, {
    status: res.status,
    statusText: res.statusText,
    headers: outHeaders,
  });
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
