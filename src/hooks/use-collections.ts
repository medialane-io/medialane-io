"use client";

import {
  useCollections as useCollectionsBase,
  useCollection as useCollectionBase,
  useCollectionsByOwner as useCollectionsByOwnerBase,
  useCollectionTokens as useCollectionTokensBase,
  useNearbyCollectionTokens as useNearbyCollectionTokensBase,
  type CollectionSort,
} from "@medialane/ui";
import { getMedialaneClient } from "@/lib/medialane-client";
import type { CollectionTokensSort } from "@medialane/sdk";

export type { CollectionSort };

export function useCollections(
  page = 1,
  limit = 20,
  isFeatured?: boolean,
  sort: CollectionSort = "recent",
  hideEmpty = true,
  service?: string
) {
  return useCollectionsBase(getMedialaneClient, page, limit, isFeatured, sort, hideEmpty, service);
}

export function useCollection(contract: string | null) {
  return useCollectionBase(getMedialaneClient, contract);
}

export function useCollectionsByOwner(owner: string | null) {
  return useCollectionsByOwnerBase(getMedialaneClient, owner);
}

export function useCollectionTokens(
  contract: string | null,
  page = 1,
  limit = 24,
  sort: CollectionTokensSort = "recent"
) {
  return useCollectionTokensBase(getMedialaneClient, contract, page, limit, sort);
}

export function useNearbyCollectionTokens(
  contract: string | null,
  currentTokenId: string | null,
  count = 4,
  poolSize = 60
) {
  return useNearbyCollectionTokensBase(getMedialaneClient, contract, currentTokenId, count, poolSize);
}
