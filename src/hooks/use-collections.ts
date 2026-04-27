"use client";

import useSWR from "swr";
import { useMedialaneClient } from "./use-medialane-client";
import type { ApiCollection, ApiResponse, CollectionSource } from "@medialane/sdk";
import { queryKeys } from "@/lib/query-keys";

export type CollectionSort = "recent" | "supply" | "floor" | "volume" | "name";

export function useCollections(
  page = 1,
  limit = 20,
  isFeatured?: boolean,
  sort: CollectionSort = "recent",
  hideEmpty = true,
  source?: CollectionSource
) {
  const client = useMedialaneClient();
  const key = queryKeys.collections(page, limit, isFeatured, sort, hideEmpty, source);

  const { data, error, isLoading, mutate } = useSWR<ApiResponse<ApiCollection[]>>(
    key,
    async () => {
      const res = await client.api.getCollections(page, limit, isFeatured, sort, source);
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
    { revalidateOnFocus: false, refreshInterval: 12000 }
  );

  return { collections: data?.data ?? [], isLoading, error, mutate };
}

export function useCollectionTokens(contract: string | null, page = 1, limit = 24) {
  const client = useMedialaneClient();

  const { data, error, isLoading, mutate } = useSWR(
    contract ? queryKeys.collectionTokens(contract, page, limit) : null,
    () => client.api.getCollectionTokens(contract!, page, limit),
    { revalidateOnFocus: false }
  );

  return { tokens: data?.data ?? [], meta: data?.meta, isLoading, error, mutate };
}
