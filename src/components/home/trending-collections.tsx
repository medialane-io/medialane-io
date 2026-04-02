"use client";

import Link from "next/link";
import { ArrowRight, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCollections } from "@/hooks/use-collections";
import { CollectionCard, CollectionCardSkeleton } from "@/components/shared/collection-card";

export function TrendingCollections() {
  const { collections, isLoading } = useCollections(1, 10, undefined, "recent");

  return (
    <section className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-md shadow-violet-500/20">
            <TrendingUp className="h-3.5 w-3.5 text-white" />
          </div>
          <h2 className="text-lg sm:text-xl font-semibold">Onchain Collections</h2>
        </div>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/collections" className="flex items-center gap-1 text-muted-foreground hover:text-foreground">
            See all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>

      {/* Scroll row — w-full + overflow-x-auto creates a self-contained scroll zone */}
      <div className="w-full overflow-x-auto scrollbar-hide">
        <div className="flex gap-4 snap-x snap-mandatory pb-2" style={{ width: "max-content" }}>
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
        </div>
      </div>
    </section>
  );
}
