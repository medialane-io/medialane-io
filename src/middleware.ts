import { clerkMiddleware, createRouteMatcher, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Routes that require a signed-in user (redirect to sign-in if signed out).
// Launchpad deploy/mint/owner surfaces sign-gate the same way /create does —
// browse pages (/launchpad, /launchpad/<service>) stay public.
const requiresSignIn = createRouteMatcher([
  "/portfolio(.*)",
  "/create(.*)",
  "/launchpad/(.*)/create",
  "/launchpad/(.*)/mint",
  "/launchpad/pop/my-events",
  "/launchpad/drop/my-drops",
  "/launchpad/memecoin",
  "/claim/(.*)",
]);

// Routes that require COMPLETED onboarding once signed in. Campaign routes are
// included so signed-in-but-no-wallet users are funnelled through /onboarding —
// but they stay fully public for signed-out visitors (Google-Ads landings).
const requiresOnboarding = createRouteMatcher([
  "/portfolio(.*)",
  "/create(.*)",
  "/launchpad/(.*)/create",
  "/launchpad/(.*)/mint",
  "/launchpad/pop/my-events",
  "/launchpad/drop/my-drops",
  "/launchpad/memecoin",
  "/claim/(.*)",
  "/mint",
  "/airdrop",
  "/br/mint",
]);

/**
 * Read walletCreated from JWT session claims — zero Clerk API calls.
 * Requires Clerk dashboard → Sessions → Customize session token:
 *   { "metadata": "{{user.public_metadata}}" }
 */
function hasWalletClaim(sessionClaims: Record<string, unknown> | null): boolean {
  const metadata = sessionClaims?.metadata as Record<string, unknown> | undefined;
  return metadata?.walletCreated === true;
}

/** Same-origin relative path guard — prevents open redirects via redirect_url. */
function safeRelative(path: string | null | undefined, fallback: string): string {
  if (!path || !path.startsWith("/") || path.startsWith("//")) return fallback;
  return path;
}

export default clerkMiddleware(async (auth, req) => {
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-pathname", req.nextUrl.pathname);

  const { userId, sessionClaims, redirectToSignIn } = await auth();

  // Unauthenticated user hitting a sign-in-required route → sign-in.
  // (Campaign routes are NOT here — they stay public for signed-out visitors.)
  if (!userId && requiresSignIn(req)) {
    return redirectToSignIn({ returnBackUrl: req.url });
  }

  if (userId) {
    let hasWallet = hasWalletClaim(sessionClaims as Record<string, unknown> | null);

    // Fallback: JWT may be stale or template not configured — check Clerk API once.
    if (!hasWallet && requiresOnboarding(req)) {
      try {
        const client = await clerkClient();
        const clerkUser = await client.users.getUser(userId);
        hasWallet = clerkUser.publicMetadata?.walletCreated === true;
      } catch {
        // If API check fails, keep JWT-derived values
      }
    }

    // Already onboarded but sitting on /onboarding → honor redirect_url.
    if (hasWallet && req.nextUrl.pathname === "/onboarding") {
      const dest = safeRelative(req.nextUrl.searchParams.get("redirect_url"), "/welcome");
      return NextResponse.redirect(new URL(dest, req.url));
    }

    // Signed in, not onboarded, on a gated route → onboarding, carrying origin.
    // Robust by design: even if Clerk drops the post-auth redirect, the user is
    // funnelled here the moment they reach a gated route — no dependence on Clerk.
    if (!hasWallet && requiresOnboarding(req)) {
      const onboardingUrl = new URL("/onboarding", req.url);
      onboardingUrl.searchParams.set("redirect_url", req.nextUrl.pathname + req.nextUrl.search);
      return NextResponse.redirect(onboardingUrl);
    }
  }

  return NextResponse.next({ request: { headers: requestHeaders } });
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
