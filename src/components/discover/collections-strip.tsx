"use client";

import { useCollections } from "@/hooks/use-collections";
import { DiscoverCollectionsStrip } from "@medialane/ui";
import type { ApiCollection } from "@medialane/sdk";

export function CollectionsStrip() {
  const { collections, isLoading } = useCollections(1, 10, undefined, "createdAt");

  return (
    <DiscoverCollectionsStrip
      collections={collections}
      isLoading={isLoading}
      getHref={(c: ApiCollection) => `/collections/${c.contractAddress}`}
      allCollectionsHref="/collections"
    />
  );
}
