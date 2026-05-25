"use client";

import { useState, useCallback, useRef } from "react";
import { useAuth } from "@clerk/nextjs";
import { useChipiWallet, useChipiContext } from "@chipi-stack/nextjs";
import { TxBuilder } from "@chipi-stack/core";
import { decryptPrivateKey } from "@chipi-stack/backend";
import { Account } from "starknet";
import { starknetProvider } from "@/lib/starknet";
import type { WalletCredentials } from "@/types";

// ─── Types ────────────────────────────────────────────────────────────────

const CHIPI_WALLET_CLASS_HASH = "0x053f4f8791ed5bed0fddaa553d180c664e32cfaf8316bb232ae77bb08f459f2a";
const READY_WALLET_CLASS_HASH = "0x036078334509b514626504edc9fb252328d1a240e4e948bef8d0c08dff45927f";

export type ChipiCall = {
  contractAddress: string;
  entrypoint: string;
  calldata: string[];
};

export type ChipiTransactionParams = {
  pin: string;
  calls: ChipiCall[];
  wallet?: WalletCredentials;
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

// ─── Hook ─────────────────────────────────────────────────────────────────

export function useChipiTransaction() {
  const { userId, getToken } = useAuth();
  const { chipiSDK } = useChipiContext();

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
      const publicKey = wallet?.publicKey;
      const encryptedPrivateKey = wallet?.encryptedPrivateKey;
      if (!publicKey || !encryptedPrivateKey) {
        throw new Error("Wallet not set up. Please create your wallet first.");
      }
      return { publicKey, encryptedPrivateKey, walletType: wallet.walletType };
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

        // Decrypt the wallet key client-side via ChipiPay's own util.
        const privateKey = decryptPrivateKey(wallet.encryptedPrivateKey, params.pin);
        if (!privateKey) {
          throw new Error("Could not unlock wallet — wrong PIN.");
        }

        // Build a starknet.js Account; ChipiPay's wallet.publicKey is the account address.
        // cairoVersion "1" is passed explicitly — ChipiPay accounts are Cairo 1 — so
        // starknet.js skips on-chain cairo-version detection (a getClassHashAt RPC call).
        const account = new Account(starknetProvider, wallet.publicKey, privateKey, "1");

        const originalGetClassHashAt = account.getClassHashAt.bind(account);
        account.getClassHashAt = async (contractAddress: string) => {
          if (contractAddress.toLowerCase() === account.address.toLowerCase()) {
            if (wallet.walletType === "READY") return READY_WALLET_CLASS_HASH;
            if (!wallet.walletType || wallet.walletType === "CHIPI") return CHIPI_WALLET_CLASS_HASH;
          }
          return originalGetClassHashAt(contractAddress);
        };

        // Atomic gasless execution: TxBuilder batches every call into ONE
        // transaction; sendSponsored() runs it via the ChipiPay paymaster.
        // One call reverting reverts the whole transaction — unlike the
        // hosted callAnyContract relayer, which swallowed per-call reverts.
        const paymaster = chipiSDK.createPaymasterAdapter(token);

        const result = await new TxBuilder(account, { paymaster })
          .add(params.calls)
          .sendSponsored();

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
          return { txHash: result, status: "confirmed" };
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
    [getBearerToken, getWallet, chipiSDK]
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
