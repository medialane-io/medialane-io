"use client";

import useSWR from "swr";
import { useMedialaneClient } from "./use-medialane-client";
import type { ApiCollection, ApiResponse, CollectionTokensSort } from "@medialane/sdk";
import { queryKeys } from "@/lib/query-keys";

export type CollectionSort = "recent" | "supply" | "floor" | "volume" | "name";

export function useCollections(
  page = 1,
  limit = 20,
  isFeatured?: boolean,
  sort: CollectionSort = "recent",
  hideEmpty = true,
  service?: string
) {
  const client = useMedialaneClient();
  const key = queryKeys.collections(page, limit, isFeatured, sort, hideEmpty, service);

  const { data, error, isLoading, mutate } = useSWR<ApiResponse<ApiCollection[]>>(
    key,
    async () => {
      const res = await client.api.getCollections(page, limit, isFeatured, sort, service);
      return hideEmpty
        ? { ...res, data: res.data.filter((collection) => (collection.totalSupply ?? 0) > 0) }
        : res;
    },
    { revalidateOnFocus: false }
  );

  return {
    collections: data?.data ?? [],
    meta: data?.meta,
    isLoading,
    error,
    mutate,
  };
}

export function useCollection(contract: string | null) {
  const client = useMedialaneClient();

  const { data, error, isLoading } = useSWR(
    contract ? queryKeys.collection(contract) : null,
    () => client.api.getCollection(contract!),
    { revalidateOnFocus: false }
  );

  return { collection: data?.data ?? null, isLoading, error };
}

export function useCollectionsByOwner(owner: string | null) {
  const client = useMedialaneClient();

  const { data, error, isLoading, mutate } = useSWR(
    owner ? queryKeys.collectionsOwner(owner) : null,
    () => client.api.getCollectionsByOwner(owner!),
    { revalidateOnFocus: false, refreshInterval: 60_000 }
  );

  return { collections: data?.data ?? [], isLoading, error, mutate };
}

export function useCollectionTokens(
  contract: string | null,
  page = 1,
  limit = 24,
  sort: CollectionTokensSort = "recent"
) {
  const client = useMedialaneClient();

  const { data, error, isLoading, mutate } = useSWR(
    contract ? queryKeys.collectionTokens(contract, page, limit, sort) : null,
    () => client.api.getCollectionTokens(contract!, page, limit, sort),
    { revalidateOnFocus: false }
  );

  return { tokens: data?.data ?? [], meta: data?.meta, isLoading, error, mutate };
}

/** From a token list ordered by tokenId (ascending), picks up to `count`
 *  tokens surrounding `currentTokenId` — the ones after it first, then the
 *  ones before, backfilling from whichever side has room near a collection
 *  edge. Returned in ascending tokenId order for a natural "keep browsing"
 *  feel. Falls back to the first `count` tokens when the current one isn't
 *  in the fetched page (e.g. a collection larger than the pool). */
function pickNearbyTokens<T extends { tokenId: string }>(
  tokens: T[],
  currentTokenId: string | null,
  count: number
): T[] {
  if (!currentTokenId) return tokens.slice(0, count);
  const idx = tokens.findIndex((t) => String(t.tokenId) === String(currentTokenId));
  if (idx === -1) return tokens.slice(0, count);

  const picked: T[] = [];
  let after = idx + 1;
  let before = idx - 1;
  while (picked.length < count && (after < tokens.length || before >= 0)) {
    if (after < tokens.length) picked.push(tokens[after++]);
    if (picked.length < count && before >= 0) picked.push(tokens[before--]);
  }
  return picked.sort((a, b) => Number(a.tokenId) - Number(b.tokenId));
}

/** Asset-page "more from this collection" strip — tokens near `currentTokenId`
 *  by id, not just whatever minted most recently (which can be anywhere in a
 *  large collection and feel unrelated to the piece being viewed). Pulls a
 *  bounded pool sorted `oldest` (ascending mint order, i.e. tokenId order for
 *  every Medialane-issued collection) and windows around the current token. */
export function useNearbyCollectionTokens(
  contract: string | null,
  currentTokenId: string | null,
  count = 4,
  poolSize = 60
) {
  const { tokens, isLoading, error } = useCollectionTokens(contract, 1, poolSize, "oldest");
  return { tokens: pickNearbyTokens(tokens, currentTokenId, count), isLoading, error };
}
