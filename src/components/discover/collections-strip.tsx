"use client";

import { DiscoverCollectionsStrip, useCollections } from "@medialane/ui";


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
