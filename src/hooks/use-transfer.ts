"use client";

import { useState, useCallback } from "react";
import { useSWRConfig } from "swr";
import { useWalletNativeSession } from "./use-wallet-native-session";
import { lockVenueSigner } from "@/lib/wallet/venue-signer";
import { INDEXER_REVALIDATION_DELAY_MS } from "@/lib/constants";
import { QUERY_PREFIX } from "@/lib/query-keys";
import type { Call } from "starknet";
import { friendlyErrorMessage } from "@/lib/friendly-error";

export interface TransferInput {
  contractAddress: string;
  tokenId: string;
  toAddress: string;
  tokenStandard?: "ERC721" | "ERC1155" | "UNKNOWN";
}

function isValidStarknetAddress(addr: string): boolean {
  if (!/^0x[0-9a-fA-F]{1,64}$/.test(addr)) return false;
  const stripped = addr.replace(/^0x0*/, "");
  return stripped.length > 0;
}

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
        if (!walletAddress || !signer) throw new Error("Account not ready. Please wait a moment.");
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

        setTimeout(() => invalidate(), INDEXER_REVALIDATION_DELAY_MS);
        return result.txHash;
      } catch (err: unknown) {
        const msg = friendlyErrorMessage(err, "Transfer failed");
        setError(msg);
        throw err;
      } finally {
        if (walletAddress) lockVenueSigner(walletAddress);
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
