"use client";

import { useCallback, useState } from "react";
import type { StarknetVenueSigner } from "@medialane/sdk/starknet";
import { useWalletNativeSession } from "./use-wallet-native-session";
import { lockVenueSigner } from "@/lib/wallet/venue-signer";
import { assertTransactionSucceeded } from "@/lib/wallet/intent-tx";
import { friendlyErrorMessage } from "@/lib/friendly-error";

export type WalletWriteStatus = "idle" | "processing" | "confirming" | "success" | "error";

export function useWalletWriteAction(
  verify: (txHash: string) => Promise<void> = assertTransactionSucceeded,
) {
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
        // A returned txHash only means "submitted," not "happened" — a
        // reverted transaction looks identical to a successful one until
        // this check. executeIntent/executeIntents (intent-tx.ts) already
        // verify internally before returning, so this is a no-op for those
        // callers; it's load-bearing for callers that call signer.execute()
        // directly (transfers, sends, swaps, comments) and previously had
        // no verification at all.
        if (result?.txHash) await verify(result.txHash);
        setStatus("success");
      } catch (err) {
        setError(friendlyErrorMessage(err));
        setStatus("error");
      } finally {
        lockVenueSigner(signer.address);
      }
    },
    [hasWallet, signer, verify],
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
