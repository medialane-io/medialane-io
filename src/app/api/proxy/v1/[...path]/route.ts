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
  const target = `${BACKEND_URL.replace(/\/$/, "")}/v1/${path.join("/")}${req.nextUrl.search}`;

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
