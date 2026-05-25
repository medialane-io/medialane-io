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
  // Backend Prisma TokenStandard enum is { ERC721, ERC1155 } only — UNKNOWN
  // was dropped from storage (audit 2026-05-24), so the prop is null only
  // when callers haven't supplied it yet (e.g. loading state).
  const needsFetch = tokenStandard == null;
  const { collection, isLoading } = useCollection(needsFetch ? contractAddress : null);
  return {
    tokenStandard: resolveTokenStandard(tokenStandard, collection?.standard),
    collectionStandard: collection?.standard,
    isResolving: needsFetch && isLoading,
  };
}
