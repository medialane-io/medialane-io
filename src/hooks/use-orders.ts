"use client";

import useSWR from "swr";
import { useMedialaneClient } from "./use-medialane-client";
import type { ApiOrdersQuery, ApiOrder, ApiResponse } from "@medialane/sdk";
import { queryKeys } from "@/lib/query-keys";
import { normalizeAddress } from "@medialane/sdk";
import { MEDIALANE_BACKEND_URL, MEDIALANE_API_KEY } from "@/lib/constants";

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
    { revalidateOnFocus: false, refreshInterval: 60_000, dedupingInterval: 10_000 }
  );

  return { listings: data?.data ?? [], isLoading, error, mutate };
}

export function useUserOrders(address: string | null) {
  const client = useMedialaneClient();
  const normalized = address ? normalizeAddress("STARKNET", address) : null;

  const { data, error, isLoading, mutate } = useSWR(
    normalized ? queryKeys.userOrders(normalized) : null,
    () => client.api.getOrdersByUser(normalized!),
    { revalidateOnFocus: false, refreshInterval: 60_000, dedupingInterval: 10_000 }
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
  const normalized = sellerAddress ? normalizeAddress("STARKNET", sellerAddress) : null;
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
    { revalidateOnFocus: false, refreshInterval: 60_000, dedupingInterval: 10_000 }
  );

  return {
    counterOffers: data?.data ?? [],
    total: data?.meta?.total ?? 0,
    isLoading,
    error,
    mutate,
  };
}

/** Fetch active ERC20 offers received by the given address (offers on tokens they hold). */
export function useReceivedOffers(address: string | null) {
  const normalized = address ? normalizeAddress("STARKNET", address) : null;

  const { data, error, isLoading, mutate } = useSWR<ApiResponse<ApiOrder[]>>(
    normalized ? ["received-offers", normalized] : null,
    async () => {
      const headers: Record<string, string> = {};
      if (MEDIALANE_API_KEY) headers["x-api-key"] = MEDIALANE_API_KEY;
      const res = await fetch(
        `${MEDIALANE_BACKEND_URL.replace(/\/$/, "")}/v1/orders/received/${normalized}?limit=50`,
        { headers }
      );
      if (!res.ok) throw new Error("Failed to fetch received offers");
      return res.json();
    },
    { revalidateOnFocus: false, refreshInterval: 60_000, dedupingInterval: 10_000 }
  );

  return { orders: data?.data ?? [], isLoading, error, mutate };
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
    { revalidateOnFocus: false, refreshInterval: 60_000 }
  );

  return {
    listings: data?.data ?? [],
    isLoading,
    error,
  };
}
