"use client";

import useSWR from "swr";
import { getCreatorCoinPrice, type CreatorCoinPrice } from "@medialane/sdk/starknet";
import { publicReadProvider } from "@/lib/starknet";

export function useCoinPrice(coinAddress?: string | null) {
  const { data, error, isLoading, mutate } = useSWR<CreatorCoinPrice | null>(
    coinAddress ? `coin-price-${coinAddress}` : null,

    () => getCreatorCoinPrice(coinAddress as string, publicReadProvider),
    {
      revalidateOnFocus: false,
      refreshInterval: 30_000,
      shouldRetryOnError: false,

      onError: (err) => {
        if (process.env.NODE_ENV !== "production") {
          console.warn(`[coin-price] read failed for ${coinAddress}:`, err);
        }
      },
    }
  );
  return { price: data ?? null, isLoading, error, mutate };
}
