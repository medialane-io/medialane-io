"use client";

/**
 * useCoinPrice — live Creator Coin spot price, read from its Ekubo pool.
 * Read-only (no wallet): io discovers/explores coins; trading lives on the
 * per-chain app. Thin SWR wrapper over the SDK's `getCreatorCoinPrice`.
 */

import useSWR from "swr";
import { getCreatorCoinPrice, type CreatorCoinPrice } from "@medialane/sdk";
import { starknetProvider } from "@/lib/starknet";

export function useCoinPrice(coinAddress?: string | null) {
  const { data, error, isLoading, mutate } = useSWR<CreatorCoinPrice | null>(
    coinAddress ? `coin-price-${coinAddress}` : null,
    () => getCreatorCoinPrice(coinAddress as string, starknetProvider),
    { revalidateOnFocus: false, refreshInterval: 30_000, shouldRetryOnError: false }
  );
  return { price: data ?? null, isLoading, error, mutate };
}
