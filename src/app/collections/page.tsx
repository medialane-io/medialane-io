"use client";

import { useState, useEffect } from "react";
import { useCollections } from "@/hooks/use-collections";
import { CollectionCard, CollectionCardSkeleton } from "@/components/shared/collection-card";
import { Button } from "@/components/ui/button";
import { Layers, Loader2 } from "lucide-react";
import type { ApiCollection } from "@medialane/sdk";

const PAGE_SIZE = 18;

export default function CollectionsPage() {
  const [page, setPage] = useState(1);
  const [allCollections, setAllCollections] = useState<ApiCollection[]>([]);
  const { collections, meta, isLoading } = useCollections(page, PAGE_SIZE);

  useEffect(() => {
    if (collections.length > 0) {
      setAllCollections((prev) => {
        const ids = new Set(prev.map((c) => c.contractAddress));
        const next = collections.filter((c) => !ids.has(c.contractAddress));
        return page === 1 ? collections : [...prev, ...next];
      });
    }
  }, [collections, page]);

  const hasMore = meta?.total != null ? allCollections.length < meta.total : false;
  const isInitialLoading = isLoading && allCollections.length === 0;

  return (
    <div className="container mx-auto px-4 pt-14 pb-8 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-primary">
          <Layers className="h-5 w-5" />
          <span className="text-sm font-semibold uppercase tracking-wider">Collections</span>
        </div>
        <h1 className="text-3xl font-bold">All Collections</h1>
        <p className="text-muted-foreground">
          Browse NFT collections deployed on Medialane and Starknet.
          {meta?.total != null && (
            <span className="ml-2 text-foreground font-medium">{meta.total.toLocaleString()} total</span>
          )}
        </p>
      </div>

      {isInitialLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 9 }).map((_, i) => <CollectionCardSkeleton key={i} />)}
        </div>
      ) : allCollections.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
          <Layers className="h-12 w-12 text-muted-foreground/30" />
          <p className="text-2xl font-bold">No collections yet</p>
          <p className="text-muted-foreground max-w-sm">Deploy the first collection on Medialane.</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {allCollections.map((col) => (
              <CollectionCard key={col.contractAddress} collection={col} />
            ))}
          </div>
          {hasMore && (
            <div className="flex justify-center">
              <Button variant="outline" onClick={() => setPage((p) => p + 1)} disabled={isLoading}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Load more
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
