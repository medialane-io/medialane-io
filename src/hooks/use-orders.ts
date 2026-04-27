"use client";

import useSWR from "swr";
import { useMedialaneClient } from "./use-medialane-client";
import type { ApiOrdersQuery, ApiOrder, ApiResponse } from "@medialane/sdk";
import { queryKeys } from "@/lib/query-keys";
import { normalizeAddress } from "@/lib/utils";

export function useOrders(query: ApiOrdersQuery = {}) {
  const client = useMedialaneClient();
  const key = queryKeys.orders(query);

  const { data, error, isLoading, mutate } = useSWR<ApiResponse<ApiOrder[]>>(
    key,
    () => client.api.getOrders(query),
    { revalidateOnFocus: false, refreshInterval: 30000, dedupingInterval: 5000 }
  );

  return {
    orders: data?.data ?? [],
    meta: data?.meta,
    isLoading,
    error,
    mutate,
  };
}

export function useOrder(orderHash: string | null) {
  const client = useMedialaneClient();

  const { data, error, isLoading } = useSWR(
    orderHash ? queryKeys.order(orderHash) : null,
    () => client.api.getOrder(orderHash!),
    { revalidateOnFocus: false }
  );

  return { order: data?.data ?? null, isLoading, error };
}

export function useTokenListings(contract: string | null, tokenId: string | null) {
  const client = useMedialaneClient();

  const { data, error, isLoading, mutate } = useSWR(
    contract && tokenId ? queryKeys.listings(contract, tokenId) : null,
    () => client.api.getActiveOrdersForToken(contract!, tokenId!),
    { revalidateOnFocus: false, refreshInterval: 20000, dedupingInterval: 5000 }
  );

  return { listings: data?.data ?? [], isLoading, error, mutate };
}

export function useUserOrders(address: string | null) {
  const client = useMedialaneClient();
  const normalized = address ? normalizeAddress(address) : null;

  const { data, error, isLoading, mutate } = useSWR(
    normalized ? queryKeys.userOrders(normalized) : null,
    () => client.api.getOrdersByUser(normalized!),
    { revalidateOnFocus: false, refreshInterval: 20000, dedupingInterval: 5000 }
  );

  return { orders: data?.data ?? [], isLoading, error, mutate };
}

/** Fetch counter-offers for a specific original bid (buyer view) or by seller address. */
export function useCounterOffers({
  originalOrderHash,
  sellerAddress,
}: {
  originalOrderHash?: string | null;
  sellerAddress?: string | null;
}) {
  const client = useMedialaneClient();
  const normalized = sellerAddress ? normalizeAddress(sellerAddress) : null;
  const key =
    originalOrderHash
      ? queryKeys.counterOffersByOrder(originalOrderHash)
      : normalized
      ? queryKeys.counterOffersBySeller(normalized)
      : null;

  const { data, error, isLoading, mutate } = useSWR<ApiResponse<ApiOrder[]>>(
    key,
    () => client.api.getCounterOffers({
      ...(originalOrderHash ? { originalOrderHash } : {}),
      ...(normalized ? { sellerAddress: normalized } : {}),
    }),
    { revalidateOnFocus: false, refreshInterval: 20000, dedupingInterval: 5000 }
  );

  return {
    counterOffers: data?.data ?? [],
    total: data?.meta?.total ?? 0,
    isLoading,
    error,
    mutate,
  };
}

export function useCollectionFloorListings(contract: string | null, limit = 20) {
  const client = useMedialaneClient();
  const key = contract ? queryKeys.floorListings(contract, limit) : null;

  const { data, error, isLoading } = useSWR<ApiResponse<ApiOrder[]>>(
    key,
    () =>
      client.api.getOrders({
        collection: contract!,
        status: "ACTIVE",
        sort: "price_asc",
        limit,
      }),
    { refreshInterval: 30000 }
  );

  return {
    listings: data?.data ?? [],
    isLoading,
    error,
  };
}
