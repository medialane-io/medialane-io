import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Wallet-native session state lives in localStorage only, not a server
 * session — so route gating can't happen here. Gated routes (portfolio, settings, create,
 * claim, the launchpad create/mint surfaces) each check `hasWallet` from
 * `useWalletNativeSession()` client-side and render a "secure your account"
 * state in place, same pattern as `portfolio/layout.tsx`. This middleware
 * now only forwards the request pathname, which `RootLayout` reads to pick
 * the /br locale.
 */
export default function middleware(req: NextRequest) {
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-pathname", req.nextUrl.pathname);
  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
  ],
};
