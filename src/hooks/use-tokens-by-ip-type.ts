"use client";

import useSWR from "swr";
import { MEDIALANE_BACKEND_URL, MEDIALANE_API_KEY } from "@/lib/constants";
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
    async () => {
      const res = await fetch(`${MEDIALANE_BACKEND_URL}/v1/tokens?${params}`, {
        headers: { "x-api-key": MEDIALANE_API_KEY },
      });
      if (!res.ok) throw new Error("Failed to fetch tokens");
      return res.json();
    },
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
