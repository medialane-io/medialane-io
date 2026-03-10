"use client";

import { useState, useCallback } from "react";
import { useSWRConfig } from "swr";
import { toast } from "sonner";
import { useChipiTransaction } from "./use-chipi-transaction";
import { useSessionKey } from "./use-session-key";
import type { ChipiCall } from "./use-chipi-transaction";

export interface TransferInput {
  contractAddress: string; // NFT contract address
  tokenId: string;         // Token ID — decimal ("42") or hex ("0x2a")
  toAddress: string;       // Recipient Starknet address
  pin: string;             // ChipiPay PIN to decrypt wallet key
}

/**
 * Encode a token ID (decimal or hex string) into two felt252 values
 * for Starknet u256 calldata: [low_128_bits, high_128_bits].
 */
function encodeTokenId(tokenId: string): [string, string] {
  const id = BigInt(tokenId);
  const low = (id & BigInt("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF")).toString();
  const high = (id >> BigInt(128)).toString();
  return [low, high];
}

export function useTransfer() {
  const { executeTransaction, status, txHash, error: txError, reset } =
    useChipiTransaction();
  const { walletAddress, hasWallet, isLoadingWallet } = useSessionKey();
  const { mutate } = useSWRConfig();

  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hash, setHash] = useState<string | null>(null);

  /** Invalidate owned-token and single-token SWR caches after a transfer. */
  const invalidate = useCallback(() => {
    mutate(
      (key) => {
        if (typeof key !== "string") return false;
        return key.startsWith("tokens-owned-") || key.startsWith("token-");
      },
      undefined,
      { revalidate: true }
    );
    // Re-invalidate after indexer processes the block (~10 s)
    setTimeout(() => invalidate(), 10000);
  }, [mutate]);

  const resetState = useCallback(() => {
    setIsProcessing(false);
    setError(null);
    setHash(null);
    reset();
  }, [reset]);

  const transferToken = useCallback(
    async (input: TransferInput) => {
      if (!walletAddress) throw new Error("Wallet not ready. Please wait a moment.");

      setIsProcessing(true);
      setError(null);

      try {
        const [tokenIdLow, tokenIdHigh] = encodeTokenId(input.tokenId);

        // useChipiTransaction resolves its own wallet internally via useChipiWallet.
        // No walletOverride needed here — avoids coupling to ChipiPay's internal key shape.
        const call: ChipiCall = {
          contractAddress: input.contractAddress,
          entrypoint: "transfer_from",
          calldata: [walletAddress, input.toAddress, tokenIdLow, tokenIdHigh],
        };

        const result = await executeTransaction({
          pin: input.pin,
          contractAddress: input.contractAddress,
          calls: [call],
        });

        setHash(result.txHash);

        if (result.status === "reverted") {
          const msg = result.revertReason || "Transfer reverted on-chain";
          setError(msg);
          toast.error("Transfer failed", { description: msg });
          return undefined;
        }

        toast.success("Transfer complete!", {
          description: `Token #${input.tokenId} sent successfully.`,
        });
        invalidate();
        return result.txHash;
      } catch (err: any) {
        const msg = err?.message || "Transfer failed";
        setError(msg);
        toast.error("Transfer failed", { description: msg });
      } finally {
        setIsProcessing(false);
      }
    },
    [walletAddress, executeTransaction, invalidate]
  );

  return {
    transferToken,
    walletAddress,
    hasWallet,
    isLoadingWallet,
    isProcessing,
    txStatus: status,
    txHash: hash ?? txHash,
    error: error ?? txError,
    resetState,
  };
}
