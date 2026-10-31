"use client";

import { describeError } from "@medialane/ui";
import { MedialaneApiError } from "@medialane/sdk";
import { useCallback, useState } from "react";
import type { StarknetVenueSigner } from "@medialane/sdk/starknet";
import { useWalletNativeSession } from "./use-wallet-native-session";
import { lockVenueSigner } from "@/lib/wallet/venue-signer";
import { assertTransactionSucceeded, syncTransactionBestEffort } from "@medialane/sdk/starknet";
import { getMedialaneClient } from "@/lib/medialane-client";

const verifyOnStarknet = async (txHash: string): Promise<void> => {
  await assertTransactionSucceeded(getMedialaneClient().provider, txHash);
};

const readIntoMedialane = async (txHash: string): Promise<void> => {
  await syncTransactionBestEffort(getMedialaneClient(), txHash);
};

export type WalletWriteStatus = "idle" | "processing" | "confirming" | "success" | "error";

export function useWalletWriteAction(
  verify: (txHash: string) => Promise<void> = verifyOnStarknet,
  waitUntilRead: (txHash: string) => Promise<void> = readIntoMedialane,
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
        
        if (result?.txHash) {
          await verify(result.txHash);
          await waitUntilRead(result.txHash);
        }
        setStatus("success");
      } catch (err) {
        console.error(
          "wallet action failed",
          err instanceof MedialaneApiError
            ? { message: err.message, status: err.status, code: err.serverCode, requestId: err.requestId, details: err.details }
            : err,
        );
        setError(describeError(err).message);
        setStatus("error");
      } finally {
        lockVenueSigner(signer.address);
      }
    },
    [hasWallet, signer, verify, waitUntilRead],
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
