"use client";

import { useState, useCallback, useRef } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { useCallAnyContract } from "@chipi-stack/nextjs";
import { RpcProvider } from "starknet";
import { STARKNET_RPC_URL } from "@/lib/constants";

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
  wallet?: { publicKey: string; encryptedPrivateKey: string };
};

export type ChipiTransactionResult = {
  txHash: string;
  status: "confirmed" | "reverted";
  revertReason?: string;
};

export type ChipiTransactionStatus =
  | "idle"
  | "submitting"
  | "confirming"
  | "confirmed"
  | "reverted"
  | "error";

// ─── Provider ─────────────────────────────────────────────────────────────

const provider = new RpcProvider({ nodeUrl: STARKNET_RPC_URL });

// ─── Hook ─────────────────────────────────────────────────────────────────

export function useChipiTransaction() {
  const { getToken } = useAuth();
  const { user } = useUser();
  const { callAnyContractAsync } = useCallAnyContract();

  const [status, setStatus] = useState<ChipiTransactionStatus>("idle");
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const isSubmittingRef = useRef(false);

  const getWallet = useCallback(
    (override?: ChipiTransactionParams["wallet"]) => {
      if (override) return override;
      // Check both publicMetadata (backend-set) and unsafeMetadata (frontend-set via WalletSetupDialog)
      const publicKey =
        (user?.publicMetadata?.publicKey ?? user?.unsafeMetadata?.publicKey) as
          | string
          | undefined;
      const encryptedPrivateKey =
        (user?.publicMetadata?.encryptedPrivateKey ??
          user?.unsafeMetadata?.encryptedPrivateKey) as string | undefined;
      if (!publicKey || !encryptedPrivateKey) {
        throw new Error("Wallet not set up. Please create your wallet first.");
      }
      return { publicKey, encryptedPrivateKey };
    },
    [user]
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
        const token = await getToken({
          template: process.env.NEXT_PUBLIC_CLERK_TEMPLATE_NAME || "chipipay",
        });
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
          const receipt = await provider.waitForTransaction(result, { retryInterval: 3000 });
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
          return { txHash: result, status: "confirmed" };
        } catch (receiptError: any) {
          const reason = receiptError?.message || "Transaction failed on L2";
          setStatus("reverted");
          setError(reason);
          return { txHash: result, status: "reverted", revertReason: reason };
        }
      } catch (err: any) {
        setStatus("error");
        const msg = err instanceof Error ? err.message : "Transaction failed";
        setError(msg);
        throw err;
      } finally {
        isSubmittingRef.current = false;
      }
    },
    [getToken, getWallet, callAnyContractAsync]
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
