"use client";

import { useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { useSessionKey } from "@/hooks/use-session-key";
import { getMedialaneClient } from "@/lib/medialane-client";
import { getStoredSiwsToken } from "@/lib/siws-client";

const CLERK_TEMPLATE = process.env.NEXT_PUBLIC_CLERK_TEMPLATE_NAME || "chipipay";
const SESSION_KEY_PREFIX = "ml_io_synced_";

export function AccountSyncOnLogin() {
  const { isSignedIn, isLoaded, userId, getToken } = useAuth();
  const { walletAddress, hasWallet } = useSessionKey();

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !userId || !hasWallet || !walletAddress) return;

    // Key on (userId, walletAddress, walletType) so a future walletType
    // change (e.g. a second identityProvider lands) forces a re-sync.
    // Today walletType is always CHIPIPAY on io, but matching the dapp's
    // cache shape keeps the two onboarding paths drift-free.
    const walletType = "CHIPIPAY" as const;
    const appSource = "MEDIALANE_IO" as const;
    const key = `${SESSION_KEY_PREFIX}${userId}:${walletAddress}:${walletType}`;
    if (sessionStorage.getItem(key)) return;

    let cancelled = false;
    (async () => {
      try {
        // Prefer a cached SIWS token (minted during onboarding — see
        // onboarding/page.tsx) over the Clerk JWT. Falls back to Clerk for
        // accounts that onboarded before this existed; the backend accepts
        // both (medialane-core spec 2026-06-30-remove-clerk-from-backend-
        // design.md). No new prompt here either way — a missing SIWS token
        // just means this sync uses Clerk, same as before.
        const siwsToken = getStoredSiwsToken(walletAddress);
        const token = siwsToken ?? (await getToken({ template: CLERK_TEMPLATE }));
        if (!token || cancelled) return;
        await getMedialaneClient().api.upsertMyWallet(token, {
          walletType,
          appSource,
          chain: "STARKNET",
        });
        if (!cancelled) sessionStorage.setItem(key, "1");
      } catch (error) {
        // User-facing silence is intentional (Account creation is a side
        // effect of sign-in, never a gate). Log structured so silent drift
        // in Account creation is observable (Vercel logs / future Sentry).
        if (!cancelled) {
          console.error("[ml-register] failed", {
            appSource,
            walletType,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isLoaded, isSignedIn, userId, hasWallet, walletAddress, getToken]);

  return null;
}
