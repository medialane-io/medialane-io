"use client";

import { useEffect } from "react";
import { useWalletNativeSession } from "@/hooks/use-wallet-native-session";
import { useSiwsToken } from "@/hooks/use-siws-token";
import { getMedialaneClient } from "@/lib/medialane-client";

const SESSION_KEY_PREFIX = "ml_io_synced_";

export function AccountSyncOnLogin() {
  const { hasWallet, address: walletAddress } = useWalletNativeSession();
  const { getValidToken, signIn } = useSiwsToken();

  useEffect(() => {
    if (!hasWallet || !walletAddress) return;

    const walletType = "MEDIAWALLET" as const;
    const appSource = "MEDIALANE_IO" as const;
    const key = `${SESSION_KEY_PREFIX}${walletAddress}:${walletType}`;
    if (sessionStorage.getItem(key)) return;

    let cancelled = false;
    (async () => {
      try {
        const token = getValidToken() ?? (await signIn());
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
  }, [hasWallet, walletAddress, getValidToken, signIn]);

  return null;
}
