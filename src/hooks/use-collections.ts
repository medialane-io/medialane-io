"use client";

import useSWR from "swr";
import { useMedialaneClient } from "./use-medialane-client";

export function useCollections(page = 1, limit = 20) {
  const client = useMedialaneClient();

  const { data, error, isLoading, mutate } = useSWR(
    `collections-${page}-${limit}`,
    () => client.indexer.getCollections(page, limit),
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
    contract ? `collection-${contract}` : null,
    () => client.indexer.getCollection(contract!),
    { revalidateOnFocus: false }
  );

  return { collection: data?.data ?? null, isLoading, error };
}
