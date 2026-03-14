"use client";

import Link from "next/link";
import { ArrowRight, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCollections } from "@/hooks/use-collections";
import { CollectionCard, CollectionCardSkeleton } from "@/components/shared/collection-card";

export function TrendingCollections() {
  const { collections, isLoading } = useCollections(1, 10, undefined, "volume");

  return (
    <section className="space-y-5">
      {/* Header — padded */}
      <div className="flex items-center justify-between px-4 sm:px-6 lg:px-10">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-orange-400 to-rose-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
            <TrendingUp className="h-4 w-4 text-white" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black">Trending Collections</h2>
        </div>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/collections" className="flex items-center gap-1 text-muted-foreground hover:text-foreground">
            See all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>

      {/* Full-width scroll — no px padding so cards bleed to edge */}
      <div className="flex gap-4 overflow-x-auto pb-3 px-4 sm:px-6 lg:px-10 scrollbar-hide snap-x">
        {isLoading
          ? Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="shrink-0 w-60 sm:w-72 snap-start">
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
              <div key={col.contractAddress} className="shrink-0 w-60 sm:w-72 snap-start">
                <CollectionCard collection={col} />
              </div>
            ))}
      </div>
    </section>
  );
}
