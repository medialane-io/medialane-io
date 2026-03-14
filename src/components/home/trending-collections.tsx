"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCollections } from "@/hooks/use-collections";
import { CollectionCard, CollectionCardSkeleton } from "@/components/shared/collection-card";

export function TrendingCollections() {
  const { collections, isLoading } = useCollections(1, 8, undefined, "volume");

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Trending Collections</h2>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/collections" className="flex items-center gap-1">
            See all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide snap-x">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="shrink-0 w-56 sm:w-64 snap-start">
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
              <div key={col.contractAddress} className="shrink-0 w-56 sm:w-64 snap-start">
                <CollectionCard collection={col} />
              </div>
            ))}
      </div>
    </section>
  );
}
