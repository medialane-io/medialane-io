"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Loader2, SlidersHorizontal, Search, X as XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useTokensByIpType } from "@/hooks/use-tokens-by-ip-type";
import { IP_TYPE_MAP, IP_TYPE_CONFIG } from "@/lib/ip-type-config";
import { cn } from "@/lib/utils";
import { TokenCard, TokenCardSkeleton } from "@/components/shared/token-card";
import { OfferDialog } from "@/components/marketplace/offer-dialog";
import type { ApiToken } from "@medialane/sdk";

const PAGE_SIZE = 24;

// ---- Main page ----
interface IpTypePageClientProps {
  slug: string;
}

export function IpTypePageClient({ slug }: IpTypePageClientProps) {
  const config = IP_TYPE_MAP[slug];
  const Icon = config?.icon;
  const { isSignedIn } = useAuth();
  const router = useRouter();

  const [page, setPage] = useState(1);
  const [listedOnly, setListedOnly] = useState(false);
  const [allTokens, setAllTokens] = useState<ApiToken[]>([]);
  const [offerToken, setOfferToken] = useState<ApiToken | null>(null);
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
    <div className="container mx-auto px-5 sm:px-8 lg:px-12 pt-12 pb-16 space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
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
                  "Browsing indexed IP assets on Medialane"
                )}
              </p>
            </div>
          </div>

          {/* Type switcher chips */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {IP_TYPE_CONFIG.slice(0, 6).map((t) => (
              <Link
                key={t.slug}
                href={`/${t.slug}`}
                className={cn(
                  "flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border transition-all font-medium",
                  t.slug === slug
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
                )}
              >
                <t.icon className={cn("h-3 w-3", t.slug === slug ? t.colorClass : "")} />
                {t.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Filters bar */}
        <div className="space-y-2">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <span>Filters:</span>
            </div>
            {/* Listed only toggle */}
            <button
              onClick={() => setListedOnly((v) => !v)}
              className={cn(
                "text-xs px-3 py-1.5 rounded-full border transition-all font-medium",
                listedOnly
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
              )}
            >
              Listed only{listedCount > 0 && !isInitialLoading ? ` (${listedCount})` : ""}
            </button>
            {/* Filters toggle */}
            <button
              onClick={() => setFiltersOpen((v) => !v)}
              className={cn(
                "flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-all font-medium",
                filtersOpen || activeFilterCount > 0
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
              )}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Filters
              {activeFilterCount > 0 && (
                <span className="ml-0.5 bg-primary text-primary-foreground rounded-full px-1.5 text-[10px] font-bold leading-4">
                  {activeFilterCount}
                </span>
              )}
            </button>
            {/* Active filter chips */}
            {sortOrder !== "recent" && (
              <Badge
                variant="secondary"
                className="cursor-pointer gap-1 text-xs"
                onClick={() => setSortOrder("recent")}
              >
                {sortOrder === "price_asc" ? "Price ↑" : "Price ↓"}
                <XIcon className="h-3 w-3" />
              </Badge>
            )}
            {licenseFilter !== "all" && (
              <Badge
                variant="secondary"
                className="cursor-pointer gap-1 text-xs"
                onClick={() => setLicenseFilter("all")}
              >
                {licenseFilter}
                <XIcon className="h-3 w-3" />
              </Badge>
            )}
            {creatorSearch && (
              <Badge
                variant="secondary"
                className="cursor-pointer gap-1 text-xs"
                onClick={() => { setCreatorSearch(""); setCreatorSearchInput(""); }}
              >
                {creatorSearch.length > 10 ? `${creatorSearch.slice(0, 10)}…` : creatorSearch}
                <XIcon className="h-3 w-3" />
              </Badge>
            )}
          </div>

          {/* Collapsible filter panel */}
          <AnimatePresence initial={false}>
            {filtersOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
                style={{ overflow: "hidden" }}
              >
                <div className="pt-1 pb-2 flex flex-wrap gap-3 items-end">
                  {/* Sort */}
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Sort</p>
                    <Select value={sortOrder} onValueChange={(v) => setSortOrder(v as typeof sortOrder)}>
                      <SelectTrigger className="h-8 text-xs w-44">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="recent">Recent</SelectItem>
                        <SelectItem value="price_asc">Price: Low → High</SelectItem>
                        <SelectItem value="price_desc">Price: High → Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {/* License */}
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">License</p>
                    <Select value={licenseFilter} onValueChange={setLicenseFilter}>
                      <SelectTrigger className="h-8 text-xs w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All licenses</SelectItem>
                        <SelectItem value="CC0">CC0</SelectItem>
                        <SelectItem value="CC BY">CC BY</SelectItem>
                        <SelectItem value="CC BY-SA">CC BY-SA</SelectItem>
                        <SelectItem value="CC BY-NC">CC BY-NC</SelectItem>
                        <SelectItem value="CC BY-ND">CC BY-ND</SelectItem>
                        <SelectItem value="Custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {/* Creator search */}
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Creator</p>
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                      <Input
                        className="h-8 text-xs pl-8 w-52"
                        placeholder="Name or wallet address…"
                        value={creatorSearchInput}
                        onChange={(e) => setCreatorSearchInput(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
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
                onOffer={isSignedIn ? (t) => setOfferToken(t) : undefined}
                onRemix={isSignedIn ? (t) => router.push(`/create/remix/${t.contractAddress}/${t.tokenId}`) : undefined}
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

      {offerToken && (
        <OfferDialog
          open={!!offerToken}
          onOpenChange={(v) => { if (!v) setOfferToken(null); }}
          assetContract={offerToken.contractAddress}
          tokenId={offerToken.tokenId}
          tokenName={offerToken.metadata?.name ?? `#${offerToken.tokenId}`}
        />
      )}
    </div>
  );
}
