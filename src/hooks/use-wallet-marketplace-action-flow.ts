"use client";

/**
 * Wallet-native replacement for useMarketplaceActionFlow — no PIN step, no
 * passkey-vs-PIN branch, no session activation. Unlocking happens implicitly
 * inside the wallet's own signer.execute() call. Callers gate on `hasWallet`
 * before calling beginAction, and the returned `status`/`txHash`/`error`
 * mirror useWalletWriteAction's shape for a single in-flight action.
 */

import { useState, useCallback } from "react";
import { useWalletWriteAction } from "@/hooks/use-wallet-write-action";
import type { StarknetVenueSigner } from "@medialane/sdk/starknet";

interface UseWalletMarketplaceActionFlowOptions<TValues> {
  hasWallet: boolean;
  executeAction: (values: TValues, signer: StarknetVenueSigner) => Promise<{ txHash: string } | void>;
}

export function useWalletMarketplaceActionFlow<TValues>({
  hasWallet,
  executeAction,
}: UseWalletMarketplaceActionFlowOptions<TValues>) {
  const action = useWalletWriteAction();
  const [pendingValues, setPendingValues] = useState<TValues | null>(null);

  const beginAction = useCallback(
    (values: TValues) => {
      if (!hasWallet) return false;
      setPendingValues(values);
      void action.run((signer) => executeAction(values, signer));
      return true;
    },
    [hasWallet, action, executeAction]
  );

  const resetActionFlow = useCallback(() => {
    setPendingValues(null);
    action.reset();
  }, [action]);

  return {
    status: action.status,
    txHash: action.txHash,
    error: action.error,
    pendingValues,
    beginAction,
    resetActionFlow,
  };
}
