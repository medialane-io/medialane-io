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

// ─── Error mapping ────────────────────────────────────────────────────────

/**
 * ChipiPay's paymaster simulates every sponsored tx against the session
 * key's `allowedEntrypoints` whitelist before submission. When the whitelist
 * doesn't cover the entrypoint we're calling (e.g. an entry was added in a
 * newer release but the user's existing session was created against the old
 * set — see PR #45's safe_transfer_from incident), the simulation reverts
 * and the SDK surfaces:
 *
 *   "Failed to prepare typed data: Paymaster error: An error occurred
 *    (TRANSACTION_EXECUTION_ERROR)"
 *
 * Replace with an actionable message pointing the user at the session
 * refresh UI in /portfolio/wallet.
 */
function toFriendlyExecutionError(err: unknown): {
  message: string;
  isSessionMismatch: boolean;
} {
  const raw = err instanceof Error ? err.message : "Transaction failed";
  // Chipi's decryptPrivateKey throws this exact string when the PIN doesn't
  // match the encrypted key. It surfaces before our own `if (!privateKey)`
  // guard runs, so we humanise it here for every flow that uses
  // executeTransaction (collection create, listing, offer, mint, drop claim).
  if (/Decryption resulted in empty string/i.test(raw)) {
    return {
      message: "Wrong PIN — that's not the code you set when you created your wallet. Try again.",
      isSessionMismatch: false,
    };
  }
  if (
    /prepare.{0,3}typed.{0,3}data/i.test(raw) &&
    /TRANSACTION_EXECUTION_ERROR|Paymaster\s+error/i.test(raw)
  ) {
    // This pattern is emitted for ANY paymaster simulation revert — a stale
    // session-key whitelist is one cause, but so is a transient paymaster /
    // sponsorship issue or a genuine on-chain revert. Don't assert the session
    // is at fault as fact: suggest a retry first, then session refresh as a
    // fallback. The raw reason is preserved by the caller (see catch block).
    return {
      message:
        "We couldn't authorise this transaction with the network. Tap Try again — " +
        "if it keeps failing, refresh your wallet session in Portfolio → Wallet " +
        "(toggle \"Remember session\" off and back on), then retry.",
      isSessionMismatch: true,
    };
  }
  return { message: raw, isSessionMismatch: false };
}

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
          // starknet.js v6 receipt is a discriminated union; the fields we
          // read here (execution_status / status / revert_reason) appear on
          // different variants. Narrow with a structural type that covers
          // all the shapes we care about without committing to one variant.
          type ReceiptShape = {
            execution_status?: string;
            status?: string;
            revert_reason?: string;
          };
          const receipt = (await starknetProvider.waitForTransaction(result, { retryInterval: 3000 })) as ReceiptShape;
          const executionStatus = receipt?.execution_status || receipt?.status;
          const isReverted =
            executionStatus === "REVERTED" ||
            executionStatus === "REJECTED" ||
            !!receipt?.revert_reason;

          if (isReverted) {
            const revertReason =
              receipt?.revert_reason || `Transaction reverted (${executionStatus})`;
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
        const friendly = toFriendlyExecutionError(err);
        setError(friendly.message);
        // The friendly remap is a heuristic — preserve the raw error so it
        // stays diagnosable. Log it to the console and, when we replace the
        // message, attach the original as `cause` so consumers (e.g. the
        // create/asset debug snapshot) can record the real reason.
        const rawMessage = err instanceof Error ? err.message : String(err);
        console.error("[useChipiTransaction] execution failed:", rawMessage, err);
        // Re-throw with the user-facing message when we recognised the
        // error pattern — downstream consumers (transfer-dialog, counter-
        // offers-table, launchpad pages, claim buttons) all surface the
        // throwable's `.message` directly in their error UI.
        if (friendly.isSessionMismatch) throw new Error(friendly.message, { cause: err });
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
