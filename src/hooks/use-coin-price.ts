"use client";

import useSWR from "swr";
import { getTokenBySymbol, type ApiCoinPrices } from "@medialane/sdk";
import type { CoinMarketStatus, CoinCollectionLike, CoinPriceLike } from "@medialane/ui";
import { MEDIALANE_BACKEND_URL, MEDIALANE_API_KEY } from "@/lib/constants";
import { normalizeAddress } from "@medialane/sdk";

const REFRESH_MS = 60_000;

function useAllCoinPrices() {
  const { data, isLoading } = useSWR<ApiCoinPrices>(
    "coin-prices",
    async () => {
      const headers: Record<string, string> = {};
      if (MEDIALANE_API_KEY) headers["x-api-key"] = MEDIALANE_API_KEY;
      const res = await fetch(`${MEDIALANE_BACKEND_URL.replace(/\/$/, "")}/v1/coins/prices`, { headers });
      if (!res.ok) throw new Error(`Coin prices failed: ${res.status}`);
      return ((await res.json()) as { data: ApiCoinPrices }).data;
    },
    { revalidateOnFocus: false, refreshInterval: REFRESH_MS, shouldRetryOnError: false }
  );
  return { prices: data ?? null, isLoading };
}

export function usePriceMap() {
  const { prices, isLoading } = useAllCoinPrices();
  const map: Record<string, number | null> = {};
  if (prices) {
    for (const [address, entry] of Object.entries(prices)) {
      map[address] = entry?.usdc ?? null;
    }
  }
  return { prices: map, isLoading };
}

export function useCoinPrice(coin: CoinCollectionLike): {
  price: CoinPriceLike | null;
  status: CoinMarketStatus;
  isLoading: boolean;
} {
  const { prices, isLoading } = useAllCoinPrices();

  if (isLoading || !prices) return { price: null, status: "unavailable", isLoading };

  const usdc = prices[normalizeAddress("STARKNET", coin.contractAddress)]?.usdc ?? null;

  if (usdc == null) {
    return {
      price: null,
      status: coin.isLaunched === false ? "pre-launch" : "unavailable",
      isLoading: false,
    };
  }

  const strk = getTokenBySymbol("STRK");
  const strkUsdc = strk ? (prices[normalizeAddress("STARKNET", strk.address)]?.usdc ?? null) : null;

  return {
    price: {
      quotePerCoin: strkUsdc ? usdc / strkUsdc : usdc,
      quoteSymbol: strkUsdc ? "STRK" : "USDC",
      quoteUsdRate: strkUsdc ?? 1,
    },
    status: "live",
    isLoading: false,
  };
}
