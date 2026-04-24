"use client";

import { Layers } from "lucide-react";
import { useCollections } from "@/hooks/use-collections";
import { CollectionCard, CollectionCardSkeleton } from "@/components/shared/collection-card";
import { ScrollSection } from "@/components/shared/scroll-section";

export function CollectionsStrip() {
  const { collections, isLoading } = useCollections(1, 10, undefined, "recent");

  return (
    <ScrollSection
      icon={<Layers className="h-3.5 w-3.5 text-white" />}
      iconBg="bg-gradient-to-br from-brand-blue to-indigo-600 shadow-md shadow-brand-blue/20"
      title="Collections"
      href="/collections"
      linkLabel="View all"
    >
      {isLoading
        ? Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="w-56 sm:w-64 snap-start shrink-0">
              <CollectionCardSkeleton />
            </div>
          ))
        : collections.map((col) => (
            <div key={col.contractAddress} className="w-56 sm:w-64 snap-start shrink-0">
              <CollectionCard collection={col} />
            </div>
          ))}
    </ScrollSection>
  );
}
