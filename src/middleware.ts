import { clerkMiddleware, createRouteMatcher, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isProtectedRoute = createRouteMatcher([
  "/portfolio(.*)",
  "/create(.*)",
  "/admin(.*)",
]);

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/marketplace(.*)",
  "/collections(.*)",
  "/asset(.*)",
  "/search(.*)",
  "/activities(.*)",
  "/launchpad(.*)",
  "/onboarding",
  "/api(.*)",
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

export default clerkMiddleware(async (auth, req) => {
  const { userId, sessionClaims, redirectToSignIn } = await auth();

  // Unauthenticated user hitting a protected route → sign-in
  if (!userId && isProtectedRoute(req)) {
    return redirectToSignIn({ returnBackUrl: req.url });
  }

  if (userId) {
    let hasWallet = hasWalletClaim(sessionClaims as Record<string, unknown> | null);

    // Fallback: if JWT claims don't have walletCreated (session token template not configured
    // or token is stale after onboarding), check directly via Clerk API.
    // Only runs on protected routes to avoid unnecessary API calls.
    if (!hasWallet && isProtectedRoute(req)) {
      try {
        const client = await clerkClient();
        const clerkUser = await client.users.getUser(userId);
        hasWallet = clerkUser.publicMetadata?.walletCreated === true;
      } catch {
        // If API check fails, treat as no wallet
      }
    }

    // Already has wallet and hits /onboarding → redirect to portfolio
    if (hasWallet && req.nextUrl.pathname === "/onboarding") {
      return NextResponse.redirect(new URL("/portfolio", req.url));
    }

    // Admin route — require role: "admin" in Clerk public metadata
    if (req.nextUrl.pathname.startsWith("/admin")) {
      let isAdmin = (sessionClaims?.metadata as Record<string, unknown> | undefined)?.role === "admin";
      // Fallback: JWT may be stale or template not configured — check Clerk API directly
      if (!isAdmin) {
        try {
          const client = await clerkClient();
          const clerkUser = await client.users.getUser(userId);
          isAdmin = clerkUser.publicMetadata?.role === "admin";
        } catch {
          // If API check fails, deny access
        }
      }
      if (!isAdmin) {
        return NextResponse.redirect(new URL("/portfolio", req.url));
      }
    }

    // Signed in, no wallet, hitting a protected route → onboarding
    if (!hasWallet && isProtectedRoute(req)) {
      const onboardingUrl = new URL("/onboarding", req.url);
      onboardingUrl.searchParams.set("redirect_url", req.url);
      return NextResponse.redirect(onboardingUrl);
    }
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
