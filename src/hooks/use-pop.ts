"use client";

import useSWR from "swr";
import { MEDIALANE_BACKEND_URL, MEDIALANE_API_KEY } from "@/lib/constants";
import type { ApiCollection } from "@medialane/sdk";

export interface PopClaimStatus {
  isEligible: boolean;
  hasClaimed: boolean;
  tokenId: string | null;
}

export function usePopCollections() {
  const { data, error, isLoading, mutate } = useSWR<{ data: ApiCollection[]; meta: any }>(
    "pop-collections",
    async () => {
      const params = new URLSearchParams({ source: "POP_PROTOCOL", hideEmpty: "false", limit: "50" });
      const url = `${MEDIALANE_BACKEND_URL.replace(/\/$/, "")}/v1/collections?${params}`;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (MEDIALANE_API_KEY) headers["x-api-key"] = MEDIALANE_API_KEY;
      const res = await fetch(url, { headers });
      if (!res.ok) throw new Error(`POP collections fetch failed: ${res.status}`);
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

export function usePopClaimStatus(collection: string | null, wallet: string | null) {
  const key = collection && wallet ? `pop-eligibility-${collection}-${wallet}` : null;

  const { data, error, isLoading, mutate } = useSWR<PopClaimStatus>(
    key,
    async () => {
      const url = `${MEDIALANE_BACKEND_URL.replace(/\/$/, "")}/v1/pop/eligibility/${collection}/${wallet}`;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (MEDIALANE_API_KEY) headers["x-api-key"] = MEDIALANE_API_KEY;
      const res = await fetch(url, { headers });
      if (!res.ok) throw new Error(`POP eligibility fetch failed: ${res.status}`);
      const json = await res.json();
      return json.data;
    },
    { revalidateOnFocus: false, shouldRetryOnError: false }
  );

  return { claimStatus: data ?? null, isLoading, error, mutate };
}
