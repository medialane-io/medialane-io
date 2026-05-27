"use client";

import useSWR from "swr";
import { apiFetch } from "@/lib/api-fetch";
import type { ApiCollection, ApiMeta } from "@medialane/sdk";

export interface DropMintStatus {
  mintedByWallet: number;
  totalMinted: number;
}

export interface DropConditions {
  maxSupply: string;
  price: string;
  paymentToken: string;
  startTime: number;
  endTime: number;
  maxPerWallet: string;
}

export interface ApiDropInfo {
  contractAddress: string;
  name: string | null;
  symbol: string | null;
  description: string | null;
  image: string | null;
  owner: string | null;
  totalMinted: number;
  conditions: DropConditions | null;
}

export type DropStatus = "upcoming" | "live" | "ended" | "sold_out";

export function getDropStatus(conditions: DropConditions | null, totalMinted: number): DropStatus {
  if (!conditions) return "live";
  const now = Math.floor(Date.now() / 1000);
  const max = parseInt(conditions.maxSupply, 10);
  if (max > 0 && totalMinted >= max) return "sold_out";
  if (now < conditions.startTime) return "upcoming";
  if (now > conditions.endTime) return "ended";
  return "live";
}

export function useDropCollections() {
  const { data, error, isLoading, mutate } = useSWR<{ data: ApiCollection[]; meta: ApiMeta }>(
    "drop-collections",
    () =>
      apiFetch<{ data: ApiCollection[]; meta: ApiMeta }>(
        `/v1/collections?${new URLSearchParams({ service: "drop-collection", hideEmpty: "false", limit: "50" })}`
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

export function useDropMintStatus(collection: string | null, wallet: string | null) {
  const key = collection && wallet ? `drop-mint-status-${collection}-${wallet}` : null;

  const { data, error, isLoading, mutate } = useSWR<DropMintStatus>(
    key,
    async () => {
      const json = await apiFetch<{ data: DropMintStatus }>(`/v1/drop/mint-status/${collection}/${wallet}`);
      return json.data;
    },
    { revalidateOnFocus: false, shouldRetryOnError: false }
  );

  return { mintStatus: data ?? null, isLoading, error, mutate };
}

export function useDropInfo(contractAddress: string | null) {
  const key = contractAddress ? `drop-info-${contractAddress}` : null;

  const { data, error, isLoading } = useSWR<ApiDropInfo>(
    key,
    async () => {
      const json = await apiFetch<{ data: ApiDropInfo }>(`/v1/drop/${contractAddress}/info`);
      return json.data;
    },
    { revalidateOnFocus: false, shouldRetryOnError: false }
  );

  return { dropInfo: data ?? null, isLoading, error };
}
