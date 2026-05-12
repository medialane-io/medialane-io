"use client";

import { useSessionKey } from "./use-session-key";

/**
 * Normalized wallet hook — single interface across all wallet types.
 * Use this when a component only needs to know WHO the user is.
 *
 * Delegates to useSessionKey() which resolves address via 3-tier fallback:
 * ChipiPay API → Clerk JWT claim → Medialane backend DB.
 *
 * For signing, session keys, or transaction execution — use useSessionKey()
 * or useMarketplace() directly.
 */
export function useWallet() {
  const { walletAddress, hasWallet } = useSessionKey();
  return {
    address: walletAddress,
    isConnected: hasWallet,
  };
}
