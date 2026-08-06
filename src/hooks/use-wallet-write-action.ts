"use client";

import { useCallback, useState } from "react";
import type { StarknetVenueSigner } from "@medialane/sdk/starknet";
import { useWalletNativeSession } from "./use-wallet-native-session";

export type WalletWriteStatus = "idle" | "processing" | "confirming" | "success" | "error";

/**
 * No PIN dialog, no passkey-vs-PIN detection — the wallet module is
 * passkey-only. Unlocking happens implicitly inside the signer's own
 * execute() call. This hook's only job: gate on wallet presence, track
 * status, run the caller's execute function against the current signer.
 */
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
        setError(err instanceof Error ? err.message : "Something went wrong");
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
