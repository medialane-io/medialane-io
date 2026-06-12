"use client";

import { DiscoverCollectionsStrip } from "@medialane/ui";
import { useCollections } from "@/hooks/use-collections";

export function CollectionsStrip() {
  const { collections, isLoading } = useCollections(1, 10, undefined, "recent");

  return (
    <DiscoverCollectionsStrip
      collections={collections}
      isLoading={isLoading}
      allCollectionsHref="/collections"
    />
  );
}
