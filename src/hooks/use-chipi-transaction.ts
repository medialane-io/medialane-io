"use client";

import { useState, useCallback, useRef } from "react";
import { useAuth } from "@clerk/nextjs";
import { useChipiWallet, useCallAnyContract } from "@chipi-stack/nextjs";
import { starknetProvider } from "@/lib/starknet";
import type { WalletCredentials } from "@/types";

// ─── Types ────────────────────────────────────────────────────────────────

export type ChipiCall = {
  contractAddress: string;
  entrypoint: string;
  calldata: string[];
};

export type ChipiTransactionParams = {
  pin: string;
  contractAddress: string;
  calls: ChipiCall[];
  wallet?: WalletCredentials;
};

export type ChipiTransactionResult = {
  txHash: string;
  status: "confirmed" | "reverted";
  revertReason?: string;
  events?: Array<{ from_address: string; keys: string[] }>;
};

export type ChipiTransactionStatus =
  | "idle"
  | "submitting"
  | "confirming"
  | "confirmed"
  | "reverted"
  | "error";

// ─── Hook ─────────────────────────────────────────────────────────────────

export function useChipiTransaction() {
  const { userId, getToken } = useAuth();
  const { callAnyContractAsync } = useCallAnyContract();

  const getBearerToken = useCallback(
    () =>
      getToken({
        template: process.env.NEXT_PUBLIC_CLERK_TEMPLATE_NAME || "chipipay",
      }),
    [getToken]
  );

  const { wallet } = useChipiWallet({
    externalUserId: userId,
    getBearerToken,
    enabled: !!userId,
  });

  const [status, setStatus] = useState<ChipiTransactionStatus>("idle");
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const isSubmittingRef = useRef(false);

  const getWallet = useCallback(
    (override?: ChipiTransactionParams["wallet"]) => {
      if (override) return override;
      const publicKey = wallet?.normalizedPublicKey;
      const encryptedPrivateKey = wallet?.encryptedPrivateKey;
      if (!publicKey || !encryptedPrivateKey) {
        throw new Error("Wallet not set up. Please create your wallet first.");
      }
      return { publicKey, encryptedPrivateKey };
    },
    [wallet]
  );

  const executeTransaction = useCallback(
    async (params: ChipiTransactionParams): Promise<ChipiTransactionResult> => {
      if (isSubmittingRef.current) {
        throw new Error("A transaction is already in progress");
      }

      isSubmittingRef.current = true;
      setStatus("submitting");
      setError(null);
      setTxHash(null);

      try {
        const token = await getBearerToken();
        if (!token) throw new Error("No bearer token. Please sign in again.");

        const wallet = getWallet(params.wallet);

        const result = await callAnyContractAsync({
          params: {
            encryptKey: params.pin,
            wallet: {
              publicKey: wallet.publicKey,
              encryptedPrivateKey: wallet.encryptedPrivateKey,
            },
            contractAddress: params.contractAddress,
            calls: params.calls,
          },
          bearerToken: token,
        });

        if (!result || typeof result !== "string" || !result.startsWith("0x") || result.length < 10) {
          throw new Error(`Invalid transaction response: ${JSON.stringify(result)}`);
        }

        setTxHash(result);
        setStatus("confirming");

        try {
          const receipt = await starknetProvider.waitForTransaction(result, { retryInterval: 3000 });
          const executionStatus = (receipt as any)?.execution_status || (receipt as any)?.status;
          const isReverted =
            executionStatus === "REVERTED" ||
            executionStatus === "REJECTED" ||
            (receipt as any)?.revert_reason;

          if (isReverted) {
            const revertReason =
              (receipt as any)?.revert_reason || `Transaction reverted (${executionStatus})`;
            setStatus("reverted");
            setError(revertReason);
            return { txHash: result, status: "reverted", revertReason };
          }

          setStatus("confirmed");
          return { txHash: result, status: "confirmed", events: (receipt as any)?.events ?? [] };
        } catch (receiptError: unknown) {
          const reason = receiptError instanceof Error ? receiptError.message : "Transaction failed on L2";
          setStatus("reverted");
          setError(reason);
          return { txHash: result, status: "reverted", revertReason: reason };
        }
      } catch (err: unknown) {
        setStatus("error");
        const msg = err instanceof Error ? err.message : "Transaction failed";
        setError(msg);
        throw err;
      } finally {
        isSubmittingRef.current = false;
      }
    },
    [getBearerToken, getWallet, callAnyContractAsync]
  );

  const reset = useCallback(() => {
    setStatus("idle");
    setTxHash(null);
    setError(null);
    isSubmittingRef.current = false;
  }, []);

  const statusMessage = (() => {
    switch (status) {
      case "submitting": return "Submitting transaction…";
      case "confirming": return "Confirming on blockchain…";
      case "confirmed": return "Transaction confirmed!";
      case "reverted": return "Transaction reverted";
      case "error": return "Transaction failed";
      default: return undefined;
    }
  })();

  return {
    executeTransaction,
    reset,
    status,
    statusMessage,
    txHash,
    error,
    isSubmitting: status === "submitting" || status === "confirming",
  };
}
