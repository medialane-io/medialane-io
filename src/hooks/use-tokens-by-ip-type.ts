"use client";

import useSWR from "swr";
import { apiFetch } from "@/lib/api-fetch";
import type { ApiToken, ApiResponse } from "@medialane/sdk";

// Direct fetch — bypasses SDK since getTokens() isn't in the current SDK version
export function useTokensByIpType(
  ipTypeSlug: string | null,
  page = 1,
  limit = 24
) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    sort: "recent",
    ...(ipTypeSlug ? { ipType: ipTypeSlug } : {}),
  });

  const key = `tokens-by-type-${ipTypeSlug ?? "all"}-${page}-${limit}`;

  const { data, error, isLoading, mutate } = useSWR<ApiResponse<ApiToken[]>>(
    key,
    () => apiFetch<ApiResponse<ApiToken[]>>(`/v1/tokens?${params}`),
    { revalidateOnFocus: false, refreshInterval: 30000 }
  );

  return {
    tokens: data?.data ?? [],
    meta: data?.meta,
    isLoading,
    error,
    mutate,
  };
}
