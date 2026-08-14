"use client";

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
