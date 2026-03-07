"use client";

import useSWR from "swr";
import { useMedialaneClient } from "./use-medialane-client";

export function useCollections(page = 1, limit = 20, isKnown?: boolean) {
  const client = useMedialaneClient();

  const { data, error, isLoading, mutate } = useSWR(
    `collections-${page}-${limit}-${isKnown}`,
    () => client.api.getCollections(page, limit, isKnown),
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
    () => client.api.getCollection(contract!),
    { revalidateOnFocus: false }
  );

  return { collection: data?.data ?? null, isLoading, error };
}

export function useCollectionTokens(contract: string | null, page = 1, limit = 24) {
  const client = useMedialaneClient();

  const { data, error, isLoading } = useSWR(
    contract ? `collection-tokens-${contract}-${page}` : null,
    () => client.api.getCollectionTokens(contract!, page, limit),
    { revalidateOnFocus: false }
  );

  return { tokens: data?.data ?? [], meta: data?.meta, isLoading, error };
}
