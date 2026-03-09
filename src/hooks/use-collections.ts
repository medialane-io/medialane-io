"use client";

import useSWR from "swr";
import { useMedialaneClient } from "./use-medialane-client";
import { MEDIALANE_BACKEND_URL, MEDIALANE_API_KEY } from "@/lib/constants";
import type { ApiCollection, ApiResponse } from "@medialane/sdk";

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

export function useCollectionsByOwner(owner: string | null) {
  const { data, error, isLoading, mutate } = useSWR(
    owner ? `collections-owner-${owner}` : null,
    async () => {
      const params = new URLSearchParams({ owner: owner!, page: "1", limit: "50" });
      const res = await fetch(`${MEDIALANE_BACKEND_URL}/v1/collections?${params}`, {
        headers: { "x-api-key": MEDIALANE_API_KEY },
      });
      if (!res.ok) throw new Error("Failed to fetch collections");
      return res.json() as Promise<ApiResponse<ApiCollection[]>>;
    },
    { revalidateOnFocus: false, refreshInterval: 12000 }
  );

  return { collections: data?.data ?? [], isLoading, error, mutate };
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
