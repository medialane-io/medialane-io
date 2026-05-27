"use client";

import useSWR from "swr";
import { apiFetch } from "@/lib/api-fetch";
import type { ApiCollection, ApiMeta } from "@medialane/sdk";

export interface PopClaimStatus {
  isEligible: boolean;
  hasClaimed: boolean;
  tokenId: string | null;
}

export function usePopCollections() {
  const { data, error, isLoading, mutate } = useSWR<{ data: ApiCollection[]; meta: ApiMeta }>(
    "pop-collections",
    () =>
      apiFetch<{ data: ApiCollection[]; meta: ApiMeta }>(
        `/v1/collections?${new URLSearchParams({ service: "pop-protocol", hideEmpty: "false", limit: "50" })}`
      ),
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
      const json = await apiFetch<{ data: PopClaimStatus }>(`/v1/pop/eligibility/${collection}/${wallet}`);
      return json.data;
    },
    { revalidateOnFocus: false, shouldRetryOnError: false }
  );

  return { claimStatus: data ?? null, isLoading, error, mutate };
}
