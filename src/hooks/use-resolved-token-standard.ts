"use client";

import { useCollection } from "@/hooks/use-collections";
import { resolveTokenStandard, type TokenStandard } from "@/lib/protocol/token-standard";

export function useResolvedTokenStandard(
  contractAddress: string | null,
  tokenStandard?: string | null
): {
  tokenStandard: TokenStandard;
  collectionStandard: string | null | undefined;
} {
  const { collection } = useCollection(tokenStandard == null ? contractAddress : null);
  return {
    tokenStandard: resolveTokenStandard(tokenStandard, collection?.standard),
    collectionStandard: collection?.standard,
  };
}
