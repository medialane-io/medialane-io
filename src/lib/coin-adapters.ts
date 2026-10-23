"use client";

import useSWR from "swr";
import type { ApiCoin, ApiResponse } from "@medialane/sdk";
import { coinServiceIds, type CoinFilter, type CoinSort, type CoinCollectionLike, useCoinPrice, usePriceMap } from "@medialane/ui";
import { getMedialaneClient } from "@/lib/medialane-client";
import { coinHref as buildCoinHref } from "@/lib/routes";

const TRADE_APP: Record<string, string> = { STARKNET: "https://starknet.medialane.io" };
const tradeAppFor = (chain?: string | null) => TRADE_APP[(chain ?? "STARKNET").toString().toUpperCase()] ?? TRADE_APP.STARKNET;

export function useCoinPriceAdapter(collection: CoinCollectionLike) {
  return useCoinPrice(collection);
}

export const usePriceMapAdapter = usePriceMap;

export function useCoinsAdapter({ filter, sort }: { filter: CoinFilter; sort: CoinSort }) {
  const service = filter === "all" ? "" : coinServiceIds(filter)[0] ?? "";
  const { data, isLoading } = useSWR<ApiResponse<ApiCoin[]>>(
    `coins-${filter}-${sort}`,
    () => getMedialaneClient().api.coins.list({ limit: 24, service: service || undefined, sort: sort || undefined }),
    { revalidateOnFocus: false }
  );

  return { collections: data?.data ?? [], isLoading, counts: data?.meta?.counts };
}

export function useCoin(address: string | null) {
  const { data, isLoading } = useSWR<ApiCoin>(
    address ? `coin-${address}` : null,
    () => getMedialaneClient().api.coins.get(address!),
    { revalidateOnFocus: false }
  );
  return { coin: data ?? null, isLoading };
}

export const coinHref = (c: CoinCollectionLike) => buildCoinHref("STARKNET", c.contractAddress);

export const tradeHref = (c: CoinCollectionLike) => `${tradeAppFor(c.chain)}/coins/${c.contractAddress}`;
