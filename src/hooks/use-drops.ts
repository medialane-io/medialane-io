"use client";

import useSWR from "swr";
import { MEDIALANE_BACKEND_URL, MEDIALANE_API_KEY } from "@/lib/constants";
import type { ApiCollection } from "@medialane/sdk";

export interface DropMintStatus {
  mintedByWallet: number;
  totalMinted: number;
}

export function useDropCollections() {
  const { data, error, isLoading, mutate } = useSWR<{ data: ApiCollection[]; meta: any }>(
    "drop-collections",
    async () => {
      const params = new URLSearchParams({ source: "COLLECTION_DROP", hideEmpty: "false", limit: "50" });
      const url = `${MEDIALANE_BACKEND_URL.replace(/\/$/, "")}/v1/collections?${params}`;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (MEDIALANE_API_KEY) headers["x-api-key"] = MEDIALANE_API_KEY;
      const res = await fetch(url, { headers });
      if (!res.ok) throw new Error(`Drop collections fetch failed: ${res.status}`);
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

export function useDropMintStatus(collection: string | null, wallet: string | null) {
  const key = collection && wallet ? `drop-mint-status-${collection}-${wallet}` : null;

  const { data, error, isLoading, mutate } = useSWR<DropMintStatus>(
    key,
    async () => {
      const url = `${MEDIALANE_BACKEND_URL.replace(/\/$/, "")}/v1/drop/mint-status/${collection}/${wallet}`;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (MEDIALANE_API_KEY) headers["x-api-key"] = MEDIALANE_API_KEY;
      const res = await fetch(url, { headers });
      if (!res.ok) throw new Error(`Drop mint status fetch failed: ${res.status}`);
      const json = await res.json();
      return json.data;
    },
    { revalidateOnFocus: false, shouldRetryOnError: false }
  );

  return { mintStatus: data ?? null, isLoading, error, mutate };
}
