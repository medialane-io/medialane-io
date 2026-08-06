"use client";

import { useState, useCallback } from "react";
import { useSWRConfig } from "swr";
import { useWalletNativeSession } from "./use-wallet-native-session";
import { INDEXER_REVALIDATION_DELAY_MS } from "@/lib/constants";
import { QUERY_PREFIX } from "@/lib/query-keys";
import type { Call } from "starknet";

export interface TransferInput {
  contractAddress: string; // NFT contract address
  tokenId: string;         // Token ID — decimal ("42") or hex ("0x2a")
  toAddress: string;       // Recipient Starknet address
  tokenStandard?: "ERC721" | "ERC1155" | "UNKNOWN";
}

/** Returns true if addr is a valid non-zero Starknet address (0x + 1–64 hex chars). */
function isValidStarknetAddress(addr: string): boolean {
  if (!/^0x[0-9a-fA-F]{1,64}$/.test(addr)) return false;
  const stripped = addr.replace(/^0x0*/, "");
  return stripped.length > 0; // reject 0x0
}

/**
 * Encode a token ID (decimal or hex string) into two felt252 values
 * for Starknet u256 calldata: [low_128_bits, high_128_bits].
 */
export function encodeTokenId(tokenId: string): [string, string] {
  const id = BigInt(tokenId);
  const low = (id & BigInt("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF")).toString();
  const high = (id >> BigInt(128)).toString();
  return [low, high];
}

export function useTransfer() {
  const { address: walletAddress, hasWallet, signer } = useWalletNativeSession();
  const { mutate } = useSWRConfig();

  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hash, setHash] = useState<string | null>(null);

  /** Invalidate owned-token and single-token SWR caches after a transfer. */
  const invalidate = useCallback(() => {
    mutate(
      (key) => {
        if (typeof key !== "string") return false;
        return key.startsWith(`${QUERY_PREFIX.tokensOwned}-`) || key.startsWith(`${QUERY_PREFIX.token}-`);
      },
      undefined,
      { revalidate: true }
    );
  }, [mutate]);

  const resetState = useCallback(() => {
    setIsProcessing(false);
    setError(null);
    setHash(null);
  }, []);

  const transferToken = useCallback(
    async (input: TransferInput) => {
      setIsProcessing(true);
      setError(null);

      try {
        if (!walletAddress || !signer) throw new Error("Wallet not ready. Please wait a moment.");
        if (!isValidStarknetAddress(input.toAddress)) {
          throw new Error("Invalid recipient address.");
        }
        if (!isValidStarknetAddress(input.contractAddress)) {
          throw new Error("Invalid token contract address.");
        }
        const [tokenIdLow, tokenIdHigh] = encodeTokenId(input.tokenId);

        if (!input.tokenStandard) {
          throw new Error("Token standard could not be determined. Please try again or contact support.");
        }
        const isERC1155 = input.tokenStandard === "ERC1155";
        const call: Call = isERC1155
          ? {
              contractAddress: input.contractAddress,
              entrypoint: "safe_transfer_from",
              // safe_transfer_from(from, to, id: u256, value: u256, data: Array<felt252>)
              calldata: [walletAddress, input.toAddress, tokenIdLow, tokenIdHigh, "1", "0", "0"],
            }
          : {
              contractAddress: input.contractAddress,
              entrypoint: "transfer_from",
              calldata: [walletAddress, input.toAddress, tokenIdLow, tokenIdHigh],
            };

        const result = await signer.execute([call]);
        setHash(result.txHash);

        invalidate();
        // Re-invalidate after indexer processes the block
        setTimeout(() => invalidate(), INDEXER_REVALIDATION_DELAY_MS);
        return result.txHash;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Transfer failed";
        setError(msg);
      } finally {
        setIsProcessing(false);
      }
    },
    [walletAddress, signer, invalidate]
  );

  return {
    transferToken,
    walletAddress,
    hasWallet,
    isProcessing,
    txHash: hash,
    error,
    resetState,
  };
}
