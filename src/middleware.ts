import { clerkMiddleware, createRouteMatcher, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isProtectedRoute = createRouteMatcher([
  "/portfolio(.*)",
  "/create(.*)",
  "/admin(.*)",
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

function hasAdminClaim(sessionClaims: Record<string, unknown> | null): boolean {
  const metadata = sessionClaims?.metadata as Record<string, unknown> | undefined;
  return metadata?.role === "admin";
}

export default clerkMiddleware(async (auth, req) => {
  const { userId, sessionClaims, redirectToSignIn } = await auth();

  // Unauthenticated user hitting a protected route → sign-in
  if (!userId && isProtectedRoute(req)) {
    return redirectToSignIn({ returnBackUrl: req.url });
  }

  if (userId) {
    const isAdminRoute = req.nextUrl.pathname.startsWith("/admin");
    let hasWallet = hasWalletClaim(sessionClaims as Record<string, unknown> | null);
    let isAdmin = hasAdminClaim(sessionClaims as Record<string, unknown> | null);

    // Fallback: JWT may be stale or template not configured — check Clerk API once.
    // Only runs on protected routes to avoid unnecessary API calls.
    if ((!hasWallet || (isAdminRoute && !isAdmin)) && isProtectedRoute(req)) {
      try {
        const client = await clerkClient();
        const clerkUser = await client.users.getUser(userId);
        hasWallet = clerkUser.publicMetadata?.walletCreated === true;
        isAdmin = clerkUser.publicMetadata?.role === "admin";
      } catch {
        // If API check fails, keep JWT-derived values
      }
    }

    // Already has wallet and hits /onboarding → redirect to portfolio
    if (hasWallet && req.nextUrl.pathname === "/onboarding") {
      return NextResponse.redirect(new URL("/portfolio", req.url));
    }

    // Admin route — require role: "admin"
    if (isAdminRoute && !isAdmin) {
      return NextResponse.redirect(new URL("/portfolio", req.url));
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
