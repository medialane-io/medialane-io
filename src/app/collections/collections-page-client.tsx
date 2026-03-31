"use client";

import { useState, useEffect, useRef } from "react";
import { useCollections, type CollectionSort } from "@/hooks/use-collections";
import { usePlatformStats } from "@/hooks/use-stats";
import { CollectionCard, CollectionCardSkeleton } from "@/components/shared/collection-card";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Layers, Loader2, BadgeCheck, Eye, SlidersHorizontal } from "lucide-react";
import { HelpIcon } from "@/components/ui/help-icon";
import { cn } from "@/lib/utils";
import type { ApiCollection } from "@medialane/sdk";

const PAGE_SIZE = 18;

const SORT_OPTIONS: { label: string; value: CollectionSort }[] = [
  { label: "Recent",      value: "recent"  },
  { label: "Most assets", value: "supply"  },
  { label: "Top volume",  value: "volume"  },
  { label: "Floor ↑",    value: "floor"   },
  { label: "A → Z",      value: "name"    },
];

export default function CollectionsPageClient() {
  const { stats } = usePlatformStats();
  const [sort, setSort]           = useState<CollectionSort>("recent");
  const [verified, setVerified]   = useState(false);
  const [hideEmpty, setHideEmpty] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [page, setPage]           = useState(1);
  const [allCollections, setAllCollections] = useState<ApiCollection[]>([]);

  const { collections, meta, isLoading } = useCollections(
    page,
    PAGE_SIZE,
    verified ? true : undefined,
    sort,
    hideEmpty
  );

  // Reset accumulated list whenever filters change
  const prevFilters = useRef({ sort, verified, hideEmpty });
  useEffect(() => {
    const f = prevFilters.current;
    if (f.sort !== sort || f.verified !== verified || f.hideEmpty !== hideEmpty) {
      prevFilters.current = { sort, verified, hideEmpty };
      setPage(1);
      setAllCollections([]);
    }
  }, [sort, verified, hideEmpty]);

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

  const activeFilters = [sort !== "recent", verified, !hideEmpty].filter(Boolean).length;

  const resetAll = () => {
    setSort("recent");
    setVerified(false);
    setHideEmpty(true);
  };

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

      {/* Toolbar */}
      <div className="flex items-center gap-2 pb-3 border-b border-border/60">
        <button
          onClick={() => setFiltersOpen(true)}
          className={cn(
            "relative flex items-center gap-1.5 h-9 px-3 rounded-lg border text-xs font-medium transition-colors",
            activeFilters > 0
              ? "border-primary bg-primary/10 text-primary"
              : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
          )}
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Filters
          {activeFilters > 0 && (
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
              {activeFilters}
            </span>
          )}
        </button>

        {/* Active filter pills — quick-clear */}
        {sort !== "recent" && (
          <span className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border border-primary/40 bg-primary/10 text-primary">
            {SORT_OPTIONS.find((o) => o.value === sort)?.label}
            <button onClick={() => setSort("recent")} className="ml-0.5 hover:text-primary/60">×</button>
          </span>
        )}
        {verified && (
          <span className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border border-primary/40 bg-primary/10 text-primary">
            Verified
            <button onClick={() => setVerified(false)} className="ml-0.5 hover:text-primary/60">×</button>
          </span>
        )}
        {!hideEmpty && (
          <span className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border border-primary/40 bg-primary/10 text-primary">
            Show empty
            <button onClick={() => setHideEmpty(true)} className="ml-0.5 hover:text-primary/60">×</button>
          </span>
        )}
      </div>

      {/* Filter sheet */}
      <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
        <SheetContent side="right" className="w-72 sm:w-80 flex flex-col gap-6">
          <SheetHeader>
            <SheetTitle>Filters</SheetTitle>
          </SheetHeader>

          {/* Sort */}
          <div className="space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Sort</p>
            <div className="flex flex-wrap gap-1.5">
              {SORT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setSort(opt.value)}
                  className={cn(
                    "text-xs px-3 py-1.5 rounded-full border transition-colors whitespace-nowrap",
                    sort === opt.value
                      ? "border-primary bg-primary/10 text-primary font-medium"
                      : "border-border text-muted-foreground hover:border-primary/50"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Show */}
          <div className="space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Show</p>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => setVerified((v) => !v)}
                className={cn(
                  "flex items-center gap-2 text-sm px-3 py-2 rounded-lg border transition-colors text-left",
                  verified
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:border-primary/50"
                )}
              >
                <BadgeCheck className="h-4 w-4 shrink-0" />
                Verified only
                <HelpIcon content="Show only collections with a confirmed identity verified by Medialane" side="right" />
              </button>
              <button
                onClick={() => setHideEmpty((v) => !v)}
                className={cn(
                  "flex items-center gap-2 text-sm px-3 py-2 rounded-lg border transition-colors text-left",
                  !hideEmpty
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:border-primary/50"
                )}
              >
                <Eye className="h-4 w-4 shrink-0" />
                Show empty collections
                <HelpIcon content="Include collections with no minted assets yet — hidden by default to keep the feed clean" side="right" />
              </button>
            </div>
          </div>

          {activeFilters > 0 && (
            <Button variant="ghost" size="sm" className="w-fit text-xs text-muted-foreground" onClick={resetAll}>
              Clear all filters
            </Button>
          )}
        </SheetContent>
      </Sheet>

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
              ? "No verified collections match the current filters."
              : hideEmpty
              ? "No collections with assets yet."
              : "Deploy the first collection on Medialane."}
          </p>
          {activeFilters > 0 && (
            <Button variant="outline" size="sm" onClick={resetAll}>
              Clear filters
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
