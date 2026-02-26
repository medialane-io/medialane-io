"use client";

import useSWR from "swr";
import { useMedialaneClient } from "./use-medialane-client";
import type { ApiToken, ApiResponse } from "@medialane/sdk";

export function useToken(contract: string | null, tokenId: string | null) {
  const client = useMedialaneClient();

  const { data, error, isLoading, mutate } = useSWR(
    contract && tokenId ? `token-${contract}-${tokenId}` : null,
    () => client.indexer.getToken(contract!, tokenId!),
    { revalidateOnFocus: false }
  );

  return { token: data?.data ?? null, isLoading, error, mutate };
}

export function useTokensByOwner(address: string | null, page = 1, limit = 20) {
  const client = useMedialaneClient();

  const { data, error, isLoading, mutate } = useSWR(
    address ? `tokens-owned-${address}-${page}` : null,
    () => client.indexer.getTokensByOwner(address!, page, limit),
    { revalidateOnFocus: false }
  );

  return {
    tokens: data?.data ?? [],
    meta: data?.meta,
    isLoading,
    error,
    mutate,
  };
}
