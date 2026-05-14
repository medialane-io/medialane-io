"use client";

import useSWR from "swr";
import { Contract } from "starknet";
import { IPCollectionABI } from "@medialane/sdk";
import { starknetProvider } from "@/lib/starknet";
import { COLLECTION_721_CONTRACT } from "@/lib/constants";

interface UseIsTransferableArgs {
  /** On-chain numeric collection ID (decimal string). */
  collectionId: string | undefined;
  /** Numeric token ID within the collection (decimal string). */
  tokenId: string | undefined;
}

/**
 * Wraps the audited IPCollection.is_transferable_token view.
 * Returns true when the token exists and is not archived.
 *
 * Returns undefined for tokens that do not belong to the audited registry
 * (legacy or external collections) — callers must treat undefined as
 * "no signal" and default to allowing the action.
 */
export function useIsTransferable({ collectionId, tokenId }: UseIsTransferableArgs) {
  const enabled = Boolean(collectionId && tokenId);
  const tokenKey = enabled ? `${collectionId}:${tokenId}` : undefined;

  const { data, error, isLoading } = useSWR<boolean | undefined>(
    tokenKey ? ["is-transferable", tokenKey] : null,
    async () => {
      const contract = new Contract(
        IPCollectionABI as any,
        COLLECTION_721_CONTRACT,
        starknetProvider
      );
      try {
        const result = await contract.call("is_transferable_token", [tokenKey!], {
          blockIdentifier: "latest",
        });
        return Boolean(result);
      } catch {
        return undefined;
      }
    },
    { revalidateOnFocus: false, refreshInterval: 0 }
  );

  return { isTransferable: data, isLoading, error };
}
