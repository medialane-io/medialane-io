"use client";

import { useCollection } from "@/hooks/use-collections";
import { resolveTokenStandard, type TokenStandard } from "@/lib/protocol/token-standard";

export function useResolvedTokenStandard(
  contractAddress: string | null,
  tokenStandard?: string | null
): {
  tokenStandard: TokenStandard;
  collectionStandard: string | null | undefined;
  isResolving: boolean;
} {
  const needsFetch = tokenStandard == null || tokenStandard === "UNKNOWN";
  const { collection, isLoading } = useCollection(needsFetch ? contractAddress : null);
  return {
    tokenStandard: resolveTokenStandard(tokenStandard, collection?.standard),
    collectionStandard: collection?.standard,
    isResolving: needsFetch && isLoading,
  };
}
