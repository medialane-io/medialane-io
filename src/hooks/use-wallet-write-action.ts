"use client";

import { useCallback, useState } from "react";
import type { StarknetVenueSigner } from "@medialane/sdk/starknet";
import { useWalletNativeSession } from "./use-wallet-native-session";
import { friendlyErrorMessage } from "@/lib/friendly-error";

export type WalletWriteStatus = "idle" | "processing" | "confirming" | "success" | "error";

export function useWalletWriteAction() {
  const { hasWallet, signer } = useWalletNativeSession();
  const [status, setStatus] = useState<WalletWriteStatus>("idle");
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(
    async (execute: (signer: StarknetVenueSigner) => Promise<{ txHash: string } | void>) => {
      if (!hasWallet || !signer) return;
      setStatus("processing");
      setError(null);
      try {
        const result = await execute(signer);
        if (result?.txHash) setTxHash(result.txHash);
        setStatus("confirming");
        setStatus("success");
      } catch (err) {
        setError(friendlyErrorMessage(err));
        setStatus("error");
      }
    },
    [hasWallet, signer],
  );

  const reset = useCallback(() => {
    setStatus("idle");
    setTxHash(null);
    setError(null);
  }, []);

  return {
    status,
    txHash,
    error,
    run,
    reset,
    walletNotReady: !hasWallet,
  };
}
