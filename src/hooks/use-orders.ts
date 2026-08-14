"use client";

import {
  useOrders as useOrdersBase,
  useOrder as useOrderBase,
  useTokenListings as useTokenListingsBase,
  useUserOrders as useUserOrdersBase,
  useCounterOffers as useCounterOffersBase,
  useReceivedOffers as useReceivedOffersBase,
  useCollectionFloorListings as useCollectionFloorListingsBase,
} from "@medialane/ui";
import { getMedialaneClient } from "@/lib/medialane-client";
import { MEDIALANE_BACKEND_URL, MEDIALANE_API_KEY } from "@/lib/constants";
import type { ApiOrdersQuery } from "@medialane/sdk";

const apiConfig = { baseUrl: MEDIALANE_BACKEND_URL, apiKey: MEDIALANE_API_KEY };

export function useOrders(query: ApiOrdersQuery = {}) {
  return useOrdersBase(getMedialaneClient, query);
}

export function useOrder(orderHash: string | null) {
  return useOrderBase(getMedialaneClient, orderHash);
}

export function useTokenListings(contract: string | null, tokenId: string | null) {
  return useTokenListingsBase(getMedialaneClient, contract, tokenId);
}

export function useUserOrders(address: string | null) {
  return useUserOrdersBase(getMedialaneClient, address);
}

export function useCounterOffers(args: { originalOrderHash?: string | null; sellerAddress?: string | null }) {
  return useCounterOffersBase(getMedialaneClient, args);
}

export function useReceivedOffers(address: string | null) {
  return useReceivedOffersBase(apiConfig, address);
}

export function useCollectionFloorListings(contract: string | null, limit = 20) {
  return useCollectionFloorListingsBase(getMedialaneClient, contract, limit);
}
