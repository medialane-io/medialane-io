"use client";

import useSWR from "swr";
import { useMedialaneClient } from "./use-medialane-client";
import type { ApiOrdersQuery, ApiOrder, ApiResponse } from "@medialane/sdk";

export function useOrders(query: ApiOrdersQuery = {}) {
  const client = useMedialaneClient();
  const key = JSON.stringify({ op: "orders", ...query });

  const { data, error, isLoading, mutate } = useSWR<ApiResponse<ApiOrder[]>>(
    key,
    () => client.indexer.getOrders(query),
    { revalidateOnFocus: false }
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
    orderHash ? `order-${orderHash}` : null,
    () => client.indexer.getOrder(orderHash!),
    { revalidateOnFocus: false }
  );

  return { order: data?.data ?? null, isLoading, error };
}

export function useTokenListings(contract: string | null, tokenId: string | null) {
  const client = useMedialaneClient();

  const { data, error, isLoading, mutate } = useSWR(
    contract && tokenId ? `listings-${contract}-${tokenId}` : null,
    () => client.indexer.getListingsForToken(contract!, tokenId!),
    { revalidateOnFocus: false }
  );

  return { listings: data?.data ?? [], isLoading, error, mutate };
}

export function useUserOrders(address: string | null) {
  const client = useMedialaneClient();

  const { data, error, isLoading, mutate } = useSWR(
    address ? `user-orders-${address}` : null,
    () => client.indexer.getOrdersByUser(address!),
    { revalidateOnFocus: false }
  );

  return { orders: data?.data ?? [], isLoading, error, mutate };
}
