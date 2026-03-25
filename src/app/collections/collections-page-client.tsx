"use client";

import { useState, useEffect, useRef } from "react";
import { useCollections, type CollectionSort } from "@/hooks/use-collections";
import { usePlatformStats } from "@/hooks/use-stats";
import { CollectionCard, CollectionCardSkeleton } from "@/components/shared/collection-card";
import { Button } from "@/components/ui/button";
import { Layers, Loader2, BadgeCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ApiCollection } from "@medialane/sdk";

const PAGE_SIZE = 18;

const SORT_OPTIONS: { label: string; value: CollectionSort }[] = [
  { label: "Recent",     value: "recent"  },
  { label: "Most assets", value: "supply"  },
  { label: "Top volume",  value: "volume"  },
  { label: "Floor ↑",    value: "floor"   },
  { label: "A → Z",      value: "name"    },
];

export default function CollectionsPageClient() {
  const { stats } = usePlatformStats();
  const [sort, setSort]       = useState<CollectionSort>("recent");
  const [verified, setVerified] = useState(false);
  const [page, setPage]       = useState(1);
  const [allCollections, setAllCollections] = useState<ApiCollection[]>([]);

  const { collections, meta, isLoading } = useCollections(
    page,
    PAGE_SIZE,
    verified ? true : undefined,
    sort
  );

  // Reset accumulated list whenever filters change
  const prevFilters = useRef({ sort, verified });
  useEffect(() => {
    const f = prevFilters.current;
    if (f.sort !== sort || f.verified !== verified) {
      prevFilters.current = { sort, verified };
      setPage(1);
      setAllCollections([]);
    }
  }, [sort, verified]);

  // Append new page to accumulated list
  useEffect(() => {
    if (isLoading || collections.length === 0) return;
    setAllCollections((prev) => {
      const ids = new Set(prev.map((c) => c.contractAddress));
      const next = collections.filter((c) => !ids.has(c.contractAddress));
      return page === 1 ? collections : [...prev, ...next];
    });
  }, [collections, isLoading, page]);

  const hasMore = meta?.total != null ? allCollections.length < meta.total : false;
  const isInitialLoading = isLoading && allCollections.length === 0;

  return (
    <div className="container mx-auto px-4 pt-14 pb-8 space-y-8">

      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-primary">
          <Layers className="h-5 w-5" />
          <span className="text-sm font-semibold uppercase tracking-wider">Programmable IP</span>
        </div>
        <h1 className="text-3xl font-bold">Onchain Collections</h1>
        <div className="flex flex-wrap items-center gap-2 mt-1">
          {meta?.total != null && (
            <div className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-1.5 text-sm">
              <span className="font-bold tabular-nums">{(meta.total ?? 0).toLocaleString()}</span>
              <span className="text-muted-foreground">Collections</span>
            </div>
          )}
          {stats?.tokens != null && (
            <div className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-1.5 text-sm">
              <span className="font-bold tabular-nums">{stats.tokens.toLocaleString()}</span>
              <span className="text-muted-foreground">Assets</span>
            </div>
          )}
          {stats?.sales != null && (
            <div className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-1.5 text-sm">
              <span className="font-bold tabular-nums">{stats.sales.toLocaleString()}</span>
              <span className="text-muted-foreground">Sales</span>
            </div>
          )}
        </div>
      </div>

      {/* Filter toolbar */}
      <div className="flex items-center gap-2 flex-wrap pb-2 border-b border-border/60">
        {/* Sort chips */}
        <div className="flex items-center gap-1 flex-wrap">
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setSort(opt.value)}
              className={cn(
                "text-xs px-3 py-1.5 rounded-md transition-colors whitespace-nowrap",
                sort === opt.value
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="w-px h-5 bg-border hidden sm:block" />

        {/* Verified toggle */}
        <button
          onClick={() => setVerified((v) => !v)}
          className={cn(
            "flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-colors whitespace-nowrap",
            verified
              ? "border-primary bg-primary/10 text-primary font-medium"
              : "border-border text-muted-foreground hover:border-primary/50"
          )}
        >
          <BadgeCheck className="h-3.5 w-3.5" />
          Verified only
        </button>
      </div>

      {/* Grid */}
      {isInitialLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {Array.from({ length: 9 }).map((_, i) => <CollectionCardSkeleton key={i} />)}
        </div>
      ) : allCollections.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
          <Layers className="h-12 w-12 text-muted-foreground/30" />
          <p className="text-2xl font-bold">No collections found</p>
          <p className="text-muted-foreground max-w-sm">
            {verified
              ? "No verified collections match the current sort. Try removing the Verified filter."
              : "Deploy the first collection on Medialane."}
          </p>
          {verified && (
            <Button variant="outline" size="sm" onClick={() => setVerified(false)}>
              Remove filter
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {allCollections.map((col) => (
              <CollectionCard key={col.contractAddress} collection={col} />
            ))}
          </div>

          {/* Load more */}
          {hasMore && (
            <div className="flex justify-center">
              <Button
                variant="outline"
                onClick={() => setPage((p) => p + 1)}
                disabled={isLoading}
              >
                {isLoading
                  ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Loading…</>
                  : `Load more (${(meta?.total ?? 0) - allCollections.length} remaining)`}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
