"use client";

import useSWR from "swr";
import { useMedialaneClient } from "./use-medialane-client";
import type { ApiToken, ApiResponse } from "@medialane/sdk";

// Stable empty array — prevents useEffect dependency loops when SWR has no data yet
const EMPTY_TOKENS: ApiToken[] = [];

export function useToken(contract: string | null, tokenId: string | null) {
  const client = useMedialaneClient();

  const { data, error, isLoading, mutate } = useSWR(
    contract && tokenId ? `token-${contract}-${tokenId}` : null,
    () => client.api.getToken(contract!, tokenId!),
    { revalidateOnFocus: false }
  );

  return { token: data?.data ?? null, isLoading, error, mutate };
}

export function useTokensByOwner(address: string | null, page = 1, limit = 20) {
  const client = useMedialaneClient();

  const { data, error, isLoading, mutate } = useSWR(
    address ? `tokens-owned-${address}-${page}` : null,
    () => client.api.getTokensByOwner(address!, page, limit),
    { revalidateOnFocus: false, refreshInterval: 12000, revalidateOnMount: true }
  );

  return {
    tokens: data?.data ?? EMPTY_TOKENS,
    meta: data?.meta,
    isLoading,
    error,
    mutate,
  };
}

export function useTokenHistory(contract: string | null, tokenId: string | null) {
  const client = useMedialaneClient();

  const { data, error, isLoading } = useSWR(
    contract && tokenId ? `token-history-${contract}-${tokenId}` : null,
    () => client.api.getTokenHistory(contract!, tokenId!),
    { revalidateOnFocus: false }
  );

  return { history: data?.data ?? [], isLoading, error };
}
