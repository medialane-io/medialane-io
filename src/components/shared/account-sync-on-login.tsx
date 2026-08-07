"use client";

import { useEffect } from "react";
import { useWalletNativeSession } from "@/hooks/use-wallet-native-session";
import { useSiwsToken } from "@/hooks/use-siws-token";
import { getMedialaneClient } from "@/lib/medialane-client";

const SESSION_KEY_PREFIX = "ml_io_synced_";

export function AccountSyncOnLogin() {
  const { hasWallet, address: walletAddress } = useWalletNativeSession();
  const { getValidToken } = useSiwsToken();

  useEffect(() => {
    if (!hasWallet || !walletAddress) return;

    const walletType = "MEDIAWALLET" as const;
    const appSource = "MEDIALANE_IO" as const;
    const key = `${SESSION_KEY_PREFIX}${walletAddress}:${walletType}`;
    if (sessionStorage.getItem(key)) return;

    // Only ever use an ALREADY-cached, still-valid token here — this effect
    // runs on every page mount with no user gesture, so it must never call
    // signIn() (WebAuthn requires one; calling it gesture-less either hard
    // fails or, worse, surfaces an OS-level auth prompt out of nowhere,
    // repeatedly, on pages that have nothing to do with signing in). If
    // there's no valid cached token, skip silently — the eventual real
    // sign-in (write action, claim, etc.) is itself gesture-backed and
    // registers the wallet via its own bearer token at that point.
    const token = getValidToken();
    if (!token) return;

    let cancelled = false;
    (async () => {
      try {
        const pendingEmailToken = sessionStorage.getItem("ml_pending_email_token");
        if (pendingEmailToken) sessionStorage.removeItem("ml_pending_email_token");

        await getMedialaneClient().api.upsertMyWallet(token, {
          walletType,
          appSource,
          chain: "STARKNET",
          ...(pendingEmailToken ? { emailVerificationToken: pendingEmailToken } : {}),
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
  }, [hasWallet, walletAddress, getValidToken]);

  return null;
}
