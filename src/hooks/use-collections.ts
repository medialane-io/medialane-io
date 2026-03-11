"use client";

import useSWR from "swr";
import { useMedialaneClient } from "./use-medialane-client";
import { MEDIALANE_BACKEND_URL, MEDIALANE_API_KEY } from "@/lib/constants";
import type { ApiCollection, ApiResponse } from "@medialane/sdk";

export type CollectionSort = "recent" | "supply" | "floor" | "volume" | "name";

export function useCollections(
  page = 1,
  limit = 20,
  isKnown?: boolean,
  sort: CollectionSort = "recent"
) {
  // Build the URL directly so we can pass the `sort` param without
  // requiring a new SDK version to be published.
  const key = `collections-${page}-${limit}-${isKnown}-${sort}`;

  const { data, error, isLoading, mutate } = useSWR<ApiResponse<ApiCollection[]>>(
    key,
    async () => {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        sort,
      });
      if (isKnown !== undefined) params.set("isKnown", String(isKnown));
      const url = `${MEDIALANE_BACKEND_URL.replace(/\/$/, "")}/v1/collections?${params}`;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (MEDIALANE_API_KEY) headers["x-api-key"] = MEDIALANE_API_KEY;
      const res = await fetch(url, { headers });
      if (!res.ok) throw new Error(`Collections fetch failed: ${res.status}`);
      return res.json();
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
    contract ? `collection-${contract}` : null,
    () => client.api.getCollection(contract!),
    { revalidateOnFocus: false }
  );

  return { collection: data?.data ?? null, isLoading, error };
}

export function useCollectionsByOwner(owner: string | null) {
  const client = useMedialaneClient();

  const { data, error, isLoading, mutate } = useSWR(
    owner ? `collections-owner-${owner}` : null,
    () => client.api.getCollectionsByOwner(owner!),
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
