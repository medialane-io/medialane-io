"use client";

import Link from "next/link";
import { TrendingUp } from "lucide-react";
import { useCollections } from "@/hooks/use-collections";
import { CollectionCard, CollectionCardSkeleton } from "@/components/shared/collection-card";
import { ScrollSection } from "@/components/shared/scroll-section";

export function TrendingCollections() {
  const { collections, isLoading } = useCollections(1, 10, undefined, "recent");

  return (
    <ScrollSection
      icon={<TrendingUp className="h-3.5 w-3.5 text-white" />}
      iconBg="bg-gradient-to-br from-violet-500 to-indigo-600 shadow-md shadow-violet-500/20"
      title="Onchain Collections"
      href="/collections"
      linkLabel="See all"
    >
      {isLoading
        ? Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="w-56 sm:w-64 snap-start shrink-0">
              <CollectionCardSkeleton />
            </div>
          ))
        : collections.length === 0
        ? (
            <p className="text-sm text-muted-foreground py-4">
              No collections yet. Be the first to create one!
            </p>
          )
        : collections.map((col) => (
            <div key={col.contractAddress} className="w-64 snap-start shrink-0">
              <CollectionCard collection={col} />
            </div>
          ))}
    </ScrollSection>
  );
}
