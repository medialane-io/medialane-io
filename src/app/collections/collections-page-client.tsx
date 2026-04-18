"use client";

import { useState, useEffect, useRef } from "react";
import { useCollections, type CollectionSort } from "@/hooks/use-collections";
import { usePlatformStats } from "@/hooks/use-stats";
import { CollectionCard, CollectionCardSkeleton } from "@/components/shared/collection-card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Layers, Loader2, BadgeCheck, Eye, SlidersHorizontal, Award } from "lucide-react";
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

const SOURCE_TABS = [
  { label: "All",        value: undefined      },
  { label: "POP Events", value: "POP_PROTOCOL" },
] as const;

export default function CollectionsPageClient() {
  const { stats } = usePlatformStats();
  const [sort, setSort]           = useState<CollectionSort>("recent");
  const [featured, setFeatured]   = useState(false);
  const [hideEmpty, setHideEmpty] = useState(true);
  const [source, setSource]       = useState<string | undefined>(undefined);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [page, setPage]           = useState(1);
  const [allCollections, setAllCollections] = useState<ApiCollection[]>([]);

  const { collections, meta, isLoading } = useCollections(
    page,
    PAGE_SIZE,
    featured ? true : undefined,
    sort,
    source === "POP_PROTOCOL" ? false : hideEmpty,
    source
  );

  // Reset accumulated list whenever filters change
  const prevFilters = useRef({ sort, featured, hideEmpty, source });
  useEffect(() => {
    const f = prevFilters.current;
    if (f.sort !== sort || f.featured !== featured || f.hideEmpty !== hideEmpty || f.source !== source) {
      prevFilters.current = { sort, featured, hideEmpty, source };
      setPage(1);
      setAllCollections([]);
    }
  }, [sort, featured, hideEmpty, source]);

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

  const activeFilters = [sort !== "recent", featured, !hideEmpty].filter(Boolean).length;

  const resetAll = () => {
    setSort("recent");
    setFeatured(false);
    setHideEmpty(true);
  };

  const handleSourceChange = (val: string | undefined) => {
    setSource(val);
  };

  return (
    <div className="container mx-auto px-4 pt-14 pb-8 space-y-8">

      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-primary">
          <Layers className="h-5 w-5" />
          <span className="text-sm font-semibold uppercase tracking-wider">NFT</span>
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
      <div className="flex items-center gap-2 pb-3 border-b border-border/60 flex-wrap">
        <button
          onClick={() => setFiltersOpen(true)}
          className={cn(
            "relative flex items-center gap-1.5 h-9 px-3 rounded-lg border text-xs font-medium transition-colors",
            activeFilters > 0 || source !== undefined
              ? "border-primary bg-primary/10 text-primary"
              : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
          )}
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Filters
          {(activeFilters > 0 || source !== undefined) && (
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
              {activeFilters + (source !== undefined ? 1 : 0)}
            </span>
          )}
        </button>

        {/* Active filter pills — quick-clear */}
        {source !== undefined && (
          <span className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border border-primary/40 bg-primary/10 text-primary">
            <Award className="h-3 w-3" />
            POP Events
            <button onClick={() => setSource(undefined)} className="ml-0.5 hover:text-primary/60">×</button>
          </span>
        )}
        {sort !== "recent" && (
          <span className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border border-primary/40 bg-primary/10 text-primary">
            {SORT_OPTIONS.find((o) => o.value === sort)?.label}
            <button onClick={() => setSort("recent")} className="ml-0.5 hover:text-primary/60">×</button>
          </span>
        )}
        {featured && (
          <span className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border border-primary/40 bg-primary/10 text-primary">
            <BadgeCheck className="h-3 w-3" />
            Featured
            <button onClick={() => setFeatured(false)} className="ml-0.5 hover:text-primary/60">×</button>
          </span>
        )}
        {!hideEmpty && (
          <span className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border border-primary/40 bg-primary/10 text-primary">
            Show empty
            <button onClick={() => setHideEmpty(true)} className="ml-0.5 hover:text-primary/60">×</button>
          </span>
        )}
      </div>

      {/* Filters dialog */}
      <Dialog open={filtersOpen} onOpenChange={setFiltersOpen}>
        <DialogContent className="w-full max-w-sm sm:max-w-md p-0 overflow-hidden gap-0 flex flex-col max-h-[85svh]">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border/60 pr-12">
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-primary" />
              Filters
            </DialogTitle>
            {(activeFilters > 0 || source !== undefined) && (
              <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground" onClick={() => { resetAll(); setSource(undefined); }}>
                Clear all
              </Button>
            )}
          </div>

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">

            {/* Source */}
            <div className="space-y-2">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Source</p>
              <div className="flex flex-wrap gap-1.5">
                {SOURCE_TABS.map(({ label, value }) => (
                  <button
                    key={label}
                    onClick={() => handleSourceChange(value)}
                    className={cn(
                      "flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-colors whitespace-nowrap",
                      source === value
                        ? "border-primary bg-primary/10 text-primary font-medium"
                        : "border-border text-muted-foreground hover:border-primary/50"
                    )}
                  >
                    {value === "POP_PROTOCOL" && <Award className="h-3 w-3" />}
                    {label}
                  </button>
                ))}
              </div>
            </div>

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
                  onClick={() => setFeatured((v) => !v)}
                  className={cn(
                    "flex items-center gap-2 text-sm px-3 py-2 rounded-lg border transition-colors text-left",
                    featured
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/50"
                  )}
                >
                  <BadgeCheck className="h-4 w-4 shrink-0" />
                  Featured only
                  <HelpIcon content="Show only collections featured by Medialane" side="right" />
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

          </div>

          {/* Footer */}
          <div className="px-5 py-3 border-t border-border/60">
            <Button className="w-full" onClick={() => setFiltersOpen(false)}>
              Apply filters
            </Button>
          </div>

        </DialogContent>
      </Dialog>

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
            {featured
              ? "No featured collections match the current filters."
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
