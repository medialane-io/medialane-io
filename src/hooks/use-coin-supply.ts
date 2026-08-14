"use client";

import useSWR from "swr";
import { getMedialaneClient } from "@/lib/medialane-client";

export function useCoinSupply(coinAddress?: string | null, decimals = 18) {
  const { data, isLoading } = useSWR<bigint | null>(
    coinAddress ? `coin-supply-${coinAddress}` : null,
    async () => {
      const res = await getMedialaneClient().api.getCoin(coinAddress as string);
      return res.data.totalSupply ? BigInt(res.data.totalSupply) : null;
    },
    { revalidateOnFocus: false, shouldRetryOnError: false, onError: () => {} }
  );
  const raw = data ?? null;
  const supply = raw !== null ? Number(raw / 10n ** BigInt(decimals)) : null;
  return { raw, supply, isLoading };
}
