"use client";

import { useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { useSessionKey } from "@/hooks/use-session-key";

const BACKEND_URL = process.env.NEXT_PUBLIC_MEDIALANE_BACKEND_URL || "http://localhost:3001";
const CLERK_TEMPLATE = process.env.NEXT_PUBLIC_CLERK_TEMPLATE_NAME || "chipipay";
const SESSION_KEY_PREFIX = "ml_io_synced_";

export function AccountSyncOnLogin() {
  const { isSignedIn, isLoaded, userId, getToken } = useAuth();
  const { walletAddress, hasWallet } = useSessionKey();

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !userId || !hasWallet || !walletAddress) return;

    const key = `${SESSION_KEY_PREFIX}${userId}:${walletAddress}`;
    if (sessionStorage.getItem(key)) return;

    let cancelled = false;
    (async () => {
      try {
        const token = await getToken({ template: CLERK_TEMPLATE });
        if (!token || cancelled) return;
        const res = await fetch(`${BACKEND_URL}/v1/users/me`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify({
            walletType: "CHIPIPAY",
            appSource: "MEDIALANE_IO",
          }),
        });
        if (!cancelled && res.ok) sessionStorage.setItem(key, "1");
      } catch {
        // Silent — sync must never disrupt the user experience.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isLoaded, isSignedIn, userId, hasWallet, walletAddress, getToken]);

  return null;
}
