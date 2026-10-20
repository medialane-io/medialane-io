"use client";

import {
  useCollections as useCollectionsBase,
  useCollection as useCollectionBase,
  useCollectionsByOwner as useCollectionsByOwnerBase,
  useCollectionTokens as useCollectionTokensBase,
  useNearbyCollectionTokens as useNearbyCollectionTokensBase,
  type CollectionSort,
} from "@medialane/ui";
import type { ApiCollection, CollectionTokensSort } from "@medialane/sdk";

export type { CollectionSort };

export function useCollections(
  page = 1,
  limit = 20,
  isFeatured?: boolean,
  sort: CollectionSort = "recent",
  hideEmpty = true,
  service?: string,
  standard?: string,
  fallback?: ApiCollection[]
) {
  return useCollectionsBase(page, limit, isFeatured, sort, hideEmpty, service, standard, fallback);
}

export function useCollection(contract: string | null) {
  return useCollectionBase(contract);
}

export function useCollectionsByOwner(owner: string | null) {
  return useCollectionsByOwnerBase(owner);
}

export function useCollectionTokens(
  contract: string | null,
  page = 1,
  limit = 24,
  sort: CollectionTokensSort = "recent"
) {
  return useCollectionTokensBase(contract, page, limit, sort);
}

export function useNearbyCollectionTokens(
  contract: string | null,
  currentTokenId: string | null,
  count = 4,
  poolSize = 60
) {
  return useNearbyCollectionTokensBase(contract, currentTokenId, count, poolSize);
}
