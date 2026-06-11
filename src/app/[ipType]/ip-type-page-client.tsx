"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Loader2, SlidersHorizontal, Search, X as XIcon } from "lucide-react";
import { PageContainer } from "@medialane/ui";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useTokensByIpType } from "@/hooks/use-tokens-by-ip-type";
import { IP_TYPE_MAP, IP_TYPE_CONFIG } from "@medialane/ui";
import { cn } from "@/lib/utils";
import { TokenCard, TokenCardSkeleton } from "@/components/shared/token-card";
import type { ApiToken } from "@medialane/sdk";

const PAGE_SIZE = 24;

// ---- Filter chip (shared pill used in the filters dialog) ----
function FilterChip({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "text-xs px-3 py-1.5 rounded-full border transition-colors whitespace-nowrap",
        active
          ? "border-primary bg-primary/10 text-primary font-medium"
          : "border-border text-muted-foreground hover:border-primary/50"
      )}
    >
      {label}
    </button>
  );
}

// ---- Main page ----
interface IpTypePageClientProps {
  slug: string;
}

export function IpTypePageClient({ slug }: IpTypePageClientProps) {
  const config = IP_TYPE_MAP[slug];
  const Icon = config?.icon;
  const [page, setPage] = useState(1);
  const [listedOnly, setListedOnly] = useState(false);
  const [allTokens, setAllTokens] = useState<ApiToken[]>([]);
  const prevSlug = useRef(slug);

  // Filter + sort state
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [sortOrder, setSortOrder] = useState<"recent" | "price_asc" | "price_desc">("recent");
  const [licenseFilter, setLicenseFilter] = useState<string>("all");
  const [creatorSearchInput, setCreatorSearchInput] = useState("");
  const [creatorSearch, setCreatorSearch] = useState("");

  // Reset on slug change
  useEffect(() => {
    if (prevSlug.current !== slug) {
      prevSlug.current = slug;
      setPage(1);
      setAllTokens([]);
    }
  }, [slug]);

  // Debounce creator search
  useEffect(() => {
    const t = setTimeout(() => setCreatorSearch(creatorSearchInput), 300);
    return () => clearTimeout(t);
  }, [creatorSearchInput]);

  const { tokens, meta, isLoading } = useTokensByIpType(slug, page, PAGE_SIZE);

  // Accumulate pages
  useEffect(() => {
    if (isLoading) return;
    if (page === 1) {
      setAllTokens(tokens);
    } else {
      setAllTokens((prev) => {
        const seen = new Set(prev.map((t) => `${t.contractAddress}:${t.tokenId}`));
        const fresh = tokens.filter((t) => !seen.has(`${t.contractAddress}:${t.tokenId}`));
        return fresh.length > 0 ? [...prev, ...fresh] : prev;
      });
    }
  }, [tokens, isLoading, page]);

  // Active filter count (non-default values only)
  const activeFilterCount =
    (sortOrder !== "recent" ? 1 : 0) +
    (licenseFilter !== "all" ? 1 : 0) +
    (creatorSearch !== "" ? 1 : 0);
  const activeChipCount = activeFilterCount + (listedOnly ? 1 : 0);
  const hasActiveFilters = activeChipCount > 0;
  const resetAll = () => {
    setSortOrder("recent");
    setLicenseFilter("all");
    setCreatorSearch("");
    setCreatorSearchInput("");
    setListedOnly(false);
  };

  // Apply filters + sort client-side
  let displayed = listedOnly
    ? allTokens.filter((t) => (t.activeOrders?.length ?? 0) > 0)
    : [...allTokens];

  if (licenseFilter !== "all") {
    displayed = displayed.filter((t) =>
      t.metadata?.attributes?.some(
        (a) => a.trait_type === "License" && a.value === licenseFilter
      )
    );
  }
  if (creatorSearch) {
    const q = creatorSearch.toLowerCase();
    displayed = displayed.filter((t) => {
      const creatorVal =
        t.metadata?.attributes?.find((a) => a.trait_type === "Creator")?.value ?? "";
      return (
        creatorVal.toLowerCase().includes(q) ||
        t.contractAddress.toLowerCase().includes(q)
      );
    });
  }
  if (sortOrder === "price_asc") {
    displayed = [...displayed].sort((a, b) => {
      const pa = parseFloat(a.activeOrders?.[0]?.price?.formatted ?? "Infinity");
      const pb = parseFloat(b.activeOrders?.[0]?.price?.formatted ?? "Infinity");
      return pa - pb;
    });
  } else if (sortOrder === "price_desc") {
    displayed = [...displayed].sort((a, b) => {
      const pa = parseFloat(a.activeOrders?.[0]?.price?.formatted ?? "0");
      const pb = parseFloat(b.activeOrders?.[0]?.price?.formatted ?? "0");
      return pb - pa;
    });
  }

  const isInitialLoading = isLoading && allTokens.length === 0;
  const isLoadingMore = isLoading && allTokens.length > 0;
  const hasMore = meta?.total != null ? allTokens.length < meta.total : false;
  const listedCount = allTokens.filter((t) => (t.activeOrders?.length ?? 0) > 0).length;

  return (
    <PageContainer className="box-border max-w-full pt-14 pb-16 space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          {config && Icon && (
            <div className={cn("h-14 w-14 rounded-2xl flex items-center justify-center shadow-lg", config.bgClass)}>
              <Icon className={cn("h-7 w-7", config.colorClass)} />
            </div>
          )}
          <div>
            <h1 className="text-3xl font-black">{config?.label ?? slug} Assets</h1>
            <p className="text-muted-foreground mt-0.5">
              {meta?.total != null ? (
                <>{meta.total.toLocaleString()} indexed · {listedCount} listed</>
              ) : (
                "Browsing indexed digital assets on Medialane"
              )}
            </p>
          </div>
        </div>

        {/* Filters bar — single entry point + removable active chips */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setFiltersOpen(true)}
            className={cn(
              "inline-flex items-center gap-1.5 text-xs px-3.5 py-2 rounded-full border font-medium transition-colors",
              hasActiveFilters
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground"
            )}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Filters
            {activeChipCount > 0 && (
              <span className="ml-0.5 bg-primary text-primary-foreground rounded-full px-1.5 text-[10px] font-bold leading-4">
                {activeChipCount}
              </span>
            )}
          </button>

          {listedOnly && (
            <Badge variant="secondary" className="cursor-pointer gap-1 text-xs" onClick={() => setListedOnly(false)}>
              Listed only
              <XIcon className="h-3 w-3" />
            </Badge>
          )}
          {sortOrder !== "recent" && (
            <Badge variant="secondary" className="cursor-pointer gap-1 text-xs" onClick={() => setSortOrder("recent")}>
              {sortOrder === "price_asc" ? "Price ↑" : "Price ↓"}
              <XIcon className="h-3 w-3" />
            </Badge>
          )}
          {licenseFilter !== "all" && (
            <Badge variant="secondary" className="cursor-pointer gap-1 text-xs" onClick={() => setLicenseFilter("all")}>
              {licenseFilter}
              <XIcon className="h-3 w-3" />
            </Badge>
          )}
          {creatorSearch && (
            <Badge variant="secondary" className="cursor-pointer gap-1 text-xs" onClick={() => { setCreatorSearch(""); setCreatorSearchInput(""); }}>
              {creatorSearch.length > 10 ? `${creatorSearch.slice(0, 10)}…` : creatorSearch}
              <XIcon className="h-3 w-3" />
            </Badge>
          )}
        </div>

        {/* Filters dialog — matches the marketplace panel aesthetic */}
        <Dialog open={filtersOpen} onOpenChange={setFiltersOpen}>
          <DialogContent className="w-full max-w-sm sm:max-w-md p-0 overflow-hidden gap-0 flex flex-col max-h-[85svh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border/60 pr-12">
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-primary" />
                Filters
              </DialogTitle>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground" onClick={resetAll}>
                  Clear all
                </Button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
              {/* Status */}
              <div className="space-y-2">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Status</p>
                <div className="flex flex-wrap gap-1.5">
                  <FilterChip active={!listedOnly} onClick={() => setListedOnly(false)} label="All" />
                  <FilterChip
                    active={listedOnly}
                    onClick={() => setListedOnly(true)}
                    label={`Listed only${listedCount > 0 ? ` (${listedCount})` : ""}`}
                  />
                </div>
              </div>

              {/* Sort */}
              <div className="space-y-2">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Sort</p>
                <div className="flex flex-wrap gap-1.5">
                  <FilterChip active={sortOrder === "recent"} onClick={() => setSortOrder("recent")} label="Recent" />
                  <FilterChip active={sortOrder === "price_asc"} onClick={() => setSortOrder("price_asc")} label="Price ↑" />
                  <FilterChip active={sortOrder === "price_desc"} onClick={() => setSortOrder("price_desc")} label="Price ↓" />
                </div>
              </div>

              {/* License */}
              <div className="space-y-2">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">License</p>
                <div className="flex flex-wrap gap-1.5">
                  {["all", "CC0", "CC BY", "CC BY-SA", "CC BY-NC", "CC BY-ND", "Custom"].map((lic) => (
                    <FilterChip
                      key={lic}
                      active={licenseFilter === lic}
                      onClick={() => setLicenseFilter(lic)}
                      label={lic === "all" ? "All licenses" : lic}
                    />
                  ))}
                </div>
              </div>

              {/* Creator */}
              <div className="space-y-2">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Creator</p>
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    className="h-9 text-sm pl-8"
                    placeholder="Name or wallet address…"
                    value={creatorSearchInput}
                    onChange={(e) => setCreatorSearchInput(e.target.value)}
                  />
                </div>
              </div>

              {/* IP Type */}
              <div className="space-y-2 pt-1 border-t border-border/60">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">IP Type</p>
                <div className="flex flex-wrap gap-1.5">
                  {IP_TYPE_CONFIG.map((t) => (
                    <Link
                      key={t.slug}
                      href={`/${t.slug}`}
                      className={cn(
                        "inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-colors whitespace-nowrap",
                        t.slug === slug
                          ? "border-primary bg-primary/10 text-primary font-medium"
                          : "border-border text-muted-foreground hover:border-primary/50"
                      )}
                    >
                      <t.icon className={cn("h-3 w-3", t.slug === slug ? t.colorClass : "")} />
                      {t.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            <div className="px-5 py-3 border-t border-border/60">
              <Button className="w-full" onClick={() => setFiltersOpen(false)}>
                Apply filters
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Grid */}
      {isInitialLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array.from({ length: PAGE_SIZE }).map((_, i) => (
            <TokenCardSkeleton key={i} />
          ))}
        </div>
      ) : displayed.length === 0 ? (
        <div className="py-24 flex flex-col items-center gap-4 text-center">
          {config && Icon && (
            <div className={cn("h-16 w-16 rounded-2xl flex items-center justify-center", config.bgClass)}>
              <Icon className={cn("h-8 w-8", config.colorClass)} />
            </div>
          )}
          <div>
            <p className="font-semibold text-lg">
              {listedOnly ? "No listed assets yet" : "No assets indexed yet"}
            </p>
            <p className="text-muted-foreground text-sm mt-1">
              {listedOnly
                ? "Try removing the 'Listed only' filter to see all assets."
                : `Be the first to mint a ${config?.label ?? slug} asset on Medialane.`}
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href="/create/asset">Create Asset</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {displayed.map((token) => (
              <TokenCard
                key={`${token.contractAddress}:${token.tokenId}`}
                token={token}
              />
            ))}
          </div>

          {(hasMore || isLoadingMore) && !listedOnly && (
            <div className="flex justify-center pt-2">
              <Button
                variant="outline"
                size="lg"
                disabled={isLoadingMore}
                onClick={() => setPage((p) => p + 1)}
              >
                {isLoadingMore ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Loading…
                  </>
                ) : (
                  `Load more${meta?.total ? ` (${meta.total - allTokens.length} remaining)` : ""}`
                )}
              </Button>
            </div>
          )}
        </div>
      )}

    </PageContainer>
  );
}
