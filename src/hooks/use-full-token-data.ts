"use client";

import useSWR from "swr";
import { apiFetch } from "@/lib/api-fetch";

export interface FullTokenData {
  owner: string;
  metadataUri: string;
  originalCreator: string;
  registeredAt: number;
}

interface UseFullTokenDataArgs {
  ipNftAddress: string | undefined;
  tokenId: bigint | undefined;
}

export function useFullTokenData({ ipNftAddress, tokenId }: UseFullTokenDataArgs) {
  const enabled = Boolean(ipNftAddress && tokenId !== undefined);

  const { data, error, isLoading } = useSWR<FullTokenData | null>(
    enabled ? ["full-token-data", ipNftAddress, tokenId!.toString()] : null,
    async () => {
      const { data } = await apiFetch<{ data: FullTokenData | null }>(
        `/v1/ipnft/${ipNftAddress}/${tokenId!.toString()}`
      );
      return data;
    },
    { revalidateOnFocus: false, refreshInterval: 0 }
  );

  return { data: data ?? null, isLoading, error };
}
