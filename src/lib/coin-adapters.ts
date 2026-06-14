"use client";

/**
 * io bindings for the shared @medialane/ui coin surfaces.
 *
 * io discovers & explores coins but does NOT trade them — trading lives on the
 * per-chain app (Starknet today: starknet.medialane.io). The data fetch is a
 * direct call (the SDK's collections query has no `standard` filter), routed
 * through io's /api/proxy in the browser via MEDIALANE_BACKEND_URL.
 */

import useSWR from "swr";
import type { ApiCoin, ApiResponse } from "@medialane/sdk";
import type { CoinFilter, CoinSort, CoinCollectionLike } from "@medialane/ui";
import { MEDIALANE_BACKEND_URL } from "@/lib/constants";
import { useCoinPrice } from "@/hooks/use-coin-price";

/** Trading app per chain. Extend the map when ETH/Solana apps ship. */
const TRADE_APP: Record<string, string> = { STARKNET: "https://starknet.medialane.io" };
const tradeAppFor = (chain?: string | null) => TRADE_APP[(chain ?? "STARKNET").toString().toUpperCase()] ?? TRADE_APP.STARKNET;

/** io price adapter — live Ekubo spot price (read-only). */
export function useCoinPriceAdapter(collection: CoinCollectionLike) {
  const { price, isLoading } = useCoinPrice(collection.contractAddress);
  return { price, isLoading };
}

/** io data adapter — coins live in the Coin model now (/v1/coins). */
export function useCoinsAdapter({ filter, sort }: { filter: CoinFilter; sort: CoinSort }) {
  const service = filter === "creator" ? "creator-coin" : filter === "memecoin" ? "external-erc20" : "";
  const params = new URLSearchParams({ limit: "24" });
  if (service) params.set("service", service);
  const url = `${MEDIALANE_BACKEND_URL}/v1/coins?${params.toString()}`;

  const { data, isLoading } = useSWR<ApiResponse<ApiCoin[]>>(
    `coins-${filter}-${sort}`,
    () => fetch(url).then((r) => r.json()),
    { revalidateOnFocus: false }
  );
  // ApiCoin.totalSupply is a fungible decimal string; CoinCollectionLike (+ FDV
  // math) wants a number — coerce so coins satisfy it structurally.
  const collections = (data?.data ?? []).map((c) => ({
    ...c,
    totalSupply: c.totalSupply != null ? Number(c.totalSupply) : null,
  }));
  return { collections, isLoading };
}

/** Single coin from /v1/coins/:contract (read-only). Pass null to skip. */
export function useCoin(address: string | null) {
  const url = address ? `${MEDIALANE_BACKEND_URL}/v1/coins/${address}` : null;
  const { data, isLoading } = useSWR<{ data: ApiCoin }>(
    url ? `coin-${address}` : null,
    () => fetch(url!).then((r) => r.json()),
    { revalidateOnFocus: false }
  );
  return { coin: data?.data ?? null, isLoading };
}

/** Discovery → io's read-only explore page. */
export const coinHref = (c: CoinCollectionLike) => `/coins/${c.contractAddress}`;

/** Trade → the coin's chain app (Starknet today). */
export const tradeHref = (c: CoinCollectionLike) => `${tradeAppFor(c.chain)}/coins/${c.contractAddress}`;
