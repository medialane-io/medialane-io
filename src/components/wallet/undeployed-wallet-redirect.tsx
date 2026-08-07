"use client";

import { useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useWalletNativeSession } from "@/hooks/use-wallet-native-session";

// Paid-traffic landing pages — never auto-redirect away from these, they're
// the platform's ad-driven acquisition surface and have their own
// deliberately un-auto-progressed sign-up flow (see project memory:
// auto-progressing this surface broke prod, twice).
const EXCLUDED_PREFIXES = ["/mint", "/br/mint", "/airdrop", "/wallet-onboarding"];

/**
 * Global safety net for a local wallet that exists but never finished
 * deploying (e.g. a stranded key from an interrupted setup). Without this,
 * any hook that opportunistically calls signIn() fails silently against a
 * wallet that can never sign in (see WalletNotDeployedError in
 * use-siws-token.ts). Redirects straight to /wallet-onboarding, which
 * re-verifies by email and resumes/attaches the stranded key correctly —
 * no popup, no extra click: the wallet already can't do anything until
 * this completes, so there's nothing useful to interrupt.
 */
export function UndeployedWalletRedirect() {
  const { hasWallet, isDeployed } = useWalletNativeSession();
  const router = useRouter();
  const pathname = usePathname();
  const redirected = useRef(false);

  useEffect(() => {
    if (!hasWallet || isDeployed !== false) return;
    if (redirected.current) return;
    if (EXCLUDED_PREFIXES.some((p) => pathname.startsWith(p))) return;
    redirected.current = true;
    router.push(`/wallet-onboarding?redirect_url=${encodeURIComponent(pathname)}`);
  }, [hasWallet, isDeployed, pathname, router]);

  return null;
}
