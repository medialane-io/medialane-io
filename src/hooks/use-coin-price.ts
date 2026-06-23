"use client";

/**
 * useCoinPrice — live Creator Coin spot price, read from its Ekubo pool.
 * Read-only (no wallet): io discovers/explores coins; trading lives on the
 * per-chain app. Thin SWR wrapper over the SDK's `getCreatorCoinPrice`.
 */

import useSWR from "swr";
import { getCreatorCoinPrice, type CreatorCoinPrice } from "@medialane/sdk";
import { publicReadProvider } from "@/lib/starknet";

export function useCoinPrice(coinAddress?: string | null) {
  const { data, error, isLoading, mutate } = useSWR<CreatorCoinPrice | null>(
    coinAddress ? `coin-price-${coinAddress}` : null,
    // Public, read-only Ekubo spot read — must work for logged-out visitors on
    // /coins, so it uses the public provider (NOT the Clerk-gated /api/rpc proxy,
    // which returns -32000 Unauthorized to anonymous users).
    () => getCreatorCoinPrice(coinAddress as string, publicReadProvider),
    {
      revalidateOnFocus: false,
      refreshInterval: 30_000,
      shouldRetryOnError: false,
      // Contain failures here: a coin with no Ekubo pool (or a transient RPC
      // hiccup) should just render "—", never surface as a global error toast.
      // A local onError overrides the global SWRConfig handler for this key.
      onError: (err) => {
        if (process.env.NODE_ENV !== "production") {
          console.warn(`[coin-price] read failed for ${coinAddress}:`, err);
        }
      },
    }
  );
  return { price: data ?? null, isLoading, error, mutate };
}
