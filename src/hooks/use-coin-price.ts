"use client";

import useSWR from "swr";
import { getCreatorCoinMarket, type CreatorCoinMarket } from "@medialane/sdk/starknet";
import type { CoinMarketStatus } from "@medialane/ui";
import { starknetProvider } from "@/lib/starknet";

export function useCoinPrice(coinAddress?: string | null) {
  const { data, error, isLoading, mutate } = useSWR<CreatorCoinMarket>(
    coinAddress ? `coin-market-${coinAddress}` : null,

    () => getCreatorCoinMarket(coinAddress as string, starknetProvider),
    {
      revalidateOnFocus: false,
      refreshInterval: 30_000,
      shouldRetryOnError: false,

      onError: (err) => {
        if (process.env.NODE_ENV !== "production") {
          console.warn(`[coin-market] read failed for ${coinAddress}:`, err);
        }
      },
    }
  );

  const status: CoinMarketStatus = data?.status === "live"
    ? "live"
    : data?.status === "pre-launch"
      ? "pre-launch"
      : "unavailable";

  return {
    price: data?.status === "live" ? data.price : null,
    status,
    isLoading,
    error,
    mutate,
  };
}
