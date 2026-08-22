"use client";

import useSWR from "swr";
import type { ApiCoin, ApiResponse } from "@medialane/sdk";
import { coinServiceIds, type CoinFilter, type CoinSort, type CoinCollectionLike } from "@medialane/ui";
import { MEDIALANE_BACKEND_URL } from "@/lib/constants";
import { coinHref as buildCoinHref } from "@/lib/routes";
import { useCoinPrice } from "@/hooks/use-coin-price";
import { useUsdPrices, usdPriceFor } from "@/hooks/use-usd-prices";

const TRADE_APP: Record<string, string> = { STARKNET: "https://starknet.medialane.io" };
const tradeAppFor = (chain?: string | null) => TRADE_APP[(chain ?? "STARKNET").toString().toUpperCase()] ?? TRADE_APP.STARKNET;

export function useCoinPriceAdapter(collection: CoinCollectionLike) {
  const { price, status, isLoading } = useCoinPrice(collection.contractAddress);
  const usdPrices = useUsdPrices();
  const quoteUsdRate = price?.quoteSymbol ? usdPriceFor(usdPrices, price.quoteSymbol) : undefined;
  return { price: price ? { ...price, quoteUsdRate } : price, status, isLoading };
}

export function useCoinsAdapter({ filter, sort }: { filter: CoinFilter; sort: CoinSort }) {
  const service = filter === "all" ? "" : coinServiceIds(filter)[0] ?? "";
  const params = new URLSearchParams({ limit: "24" });
  if (service) params.set("service", service);
  const url = `${MEDIALANE_BACKEND_URL}/v1/coins?${params.toString()}`;

  const { data, isLoading } = useSWR<ApiResponse<ApiCoin[]>>(
    `coins-${filter}-${sort}`,
    () => fetch(url).then((r) => r.json()),
    { revalidateOnFocus: false }
  );

  return { collections: data?.data ?? [], isLoading };
}

export function useCoin(address: string | null) {
  const url = address ? `${MEDIALANE_BACKEND_URL}/v1/coins/${address}` : null;
  const { data, isLoading } = useSWR<{ data: ApiCoin }>(
    url ? `coin-${address}` : null,
    () => fetch(url!).then((r) => r.json()),
    { revalidateOnFocus: false }
  );
  return { coin: data?.data ?? null, isLoading };
}

export const coinHref = (c: CoinCollectionLike) => buildCoinHref("STARKNET", c.contractAddress);

export const tradeHref = (c: CoinCollectionLike) => `${tradeAppFor(c.chain)}/coins/${c.contractAddress}`;
