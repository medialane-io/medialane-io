"use client";

import { useWalletNativeSession } from "./use-wallet-native-session";

/**
 * Normalized wallet hook — single interface across all wallet types.
 * Use this when a component only needs to know WHO the user is.
 *
 * For signing or transaction execution, use useWalletNativeSession()
 * or useMarketplace() directly.
 */
export function useWallet() {
  const { address, hasWallet } = useWalletNativeSession();
  return {
    address,
    isConnected: hasWallet,
  };
}
