"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ListingsGrid } from "@/components/marketplace/listings-grid";
import { useMedialaneClient } from "@/hooks/use-medialane-client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X, Store, SlidersHorizontal } from "lucide-react";
import type { ApiSearchResult } from "@medialane/sdk";
import { getTokenBySymbol, parseAmount, SUPPORTED_TOKENS } from "@medialane/sdk";
import { ipfsToHttp, cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { usePlatformStats } from "@/hooks/use-stats";
import { IP_TYPES } from "@/types/ip";

const SORT_OPTIONS = [
  { label: "Recent", value: "recent" },
  { label: "Price ↑", value: "price_asc" },
  { label: "Price ↓", value: "price_desc" },
];

const TYPE_OPTIONS = [
  { label: "All", value: "" },
  { label: "Listings", value: "listings" },
  { label: "Offers", value: "offers" },
];

const CURRENCY_OPTIONS = SUPPORTED_TOKENS.map((t) => t.symbol);

function SearchBar() {
  const client = useMedialaneClient();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ApiSearchResult | null>(null);
  const [open, setOpen] = useState(false);
  // Use a nullable type so React infers MutableRefObject (not RefObject with readonly `current`)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleChange = (value: string) => {
    setQuery(value);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (!value.trim()) { setResults(null); setOpen(false); return; }
    timeoutRef.current = setTimeout(async () => {
      try {
        const res = await client.api.search(value.trim(), 8);
        setResults(res.data);
        setOpen(true);
      } catch { /* ignore */ }
    }, 300);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && query.trim()) {
      setOpen(false);
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const hasResults =
    results && ((results.tokens?.length ?? 0) > 0 || (results.collections?.length ?? 0) > 0);

  return (
    <div className="relative w-full sm:max-w-sm">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search tokens, collections…"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => hasResults && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 200)}
          className="pl-9 pr-9"
        />
        {query && (
          <button
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            onClick={() => { setQuery(""); setResults(null); setOpen(false); }}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {open && hasResults && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-xl shadow-lg z-50 overflow-hidden">
          {(results.tokens?.length ?? 0) > 0 && (
            <div>
              <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground bg-muted/30">
                Tokens
              </div>
              {results.tokens!.map((t) => (
                <Link
                  key={`${t.contractAddress}-${t.tokenId}`}
                  href={`/asset/${t.contractAddress}/${t.tokenId}`}
                  className="flex items-center gap-3 px-3 py-2.5 hover:bg-muted/50 transition-colors"
                >
                  <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center text-xs font-mono shrink-0">
                    #{t.tokenId}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{t.name ?? `Token #${t.tokenId}`}</p>
                    <p className="text-xs text-muted-foreground font-mono truncate">{t.contractAddress.slice(0, 14)}…</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
          {(results.collections?.length ?? 0) > 0 && (
            <div>
              <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground bg-muted/30">
                Collections
              </div>
              {results.collections!.map((c) => {
                const imgUrl = c.image ? ipfsToHttp(c.image) : null;
                return (
                  <Link
                    key={c.contractAddress}
                    href={`/collections/${c.contractAddress}`}
                    className="flex items-center gap-3 px-3 py-2.5 hover:bg-muted/50 transition-colors"
                  >
                    <div className="relative h-8 w-8 rounded-lg bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center text-xs font-bold shrink-0 overflow-hidden">
                      {imgUrl ? (
                        <Image src={imgUrl} alt="" fill className="object-cover" unoptimized />
                      ) : (
                        <span>{c.name?.charAt(0) ?? "?"}</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{c.name}</p>
                      <p className="text-xs text-muted-foreground font-mono truncate">{c.contractAddress.slice(0, 14)}…</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function PlatformStatsBar() {
  const { stats } = usePlatformStats();

  const items = [
    { label: "Collections", value: stats?.collections },
    { label: "Assets", value: stats?.tokens },
    { label: "Sales", value: stats?.sales },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2 pt-0.5">
      {items.map(({ label, value }) => (
        <div
          key={label}
          className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-sm"
        >
          <span className="font-bold text-foreground">
            {value !== undefined ? value.toLocaleString() : "—"}
          </span>
          <span className="text-muted-foreground">{label}</span>
        </div>
      ))}
    </div>
  );
}

function IpTypeChip({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const isActive = href === "/marketplace" ? pathname === "/marketplace" : pathname === href;
  return (
    <Link
      href={href}
      className={cn(
        "text-xs px-3 py-1 rounded-full border transition-colors whitespace-nowrap",
        isActive
          ? "border-primary bg-primary/10 text-primary font-medium"
          : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
      )}
    >
      {label}
    </Link>
  );
}

export default function MarketplacePageClient() {
  const [sort, setSort] = useState("recent");
  const [currency, setCurrency] = useState("");
  const [orderType, setOrderType] = useState("");
  const [minInput, setMinInput] = useState("");
  const [maxInput, setMaxInput] = useState("");
  const [minPrice, setMinPrice] = useState<string | undefined>();
  const [maxPrice, setMaxPrice] = useState<string | undefined>();
  const priceDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handlePriceInput = (min: string, max: string) => {
    setMinInput(min);
    setMaxInput(max);
    if (priceDebounce.current) clearTimeout(priceDebounce.current);
    // Capture decimals at call time to avoid stale closure inside the timeout
    const decimals = getTokenBySymbol(currency)?.decimals ?? 18;
    priceDebounce.current = setTimeout(() => {
      try {
        setMinPrice(min.trim() ? parseAmount(min.trim(), decimals) : undefined);
      } catch {
        setMinPrice(undefined);
      }
      try {
        setMaxPrice(max.trim() ? parseAmount(max.trim(), decimals) : undefined);
      } catch {
        setMaxPrice(undefined);
      }
    }, 400);
  };

  const handleCurrencyChange = (c: string) => {
    setCurrency(currency === c ? "" : c);
    // Clear price inputs when currency changes — decimals differ between tokens
    setMinInput("");
    setMaxInput("");
    setMinPrice(undefined);
    setMaxPrice(undefined);
  };

  const [filtersOpen, setFiltersOpen] = useState(false);
  const hasFilters = sort !== "recent" || currency || orderType || minPrice || maxPrice;
  const filterCount = [currency, orderType, minPrice || maxPrice].filter(Boolean).length;

  const resetAll = () => {
    setSort("recent");
    setCurrency("");
    setOrderType("");
    setMinInput("");
    setMaxInput("");
    setMinPrice(undefined);
    setMaxPrice(undefined);
  };

  return (
    <div className="container mx-auto px-4 pt-14 pb-8 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-primary">
          <Store className="h-5 w-5" />
          <span className="text-sm font-semibold uppercase tracking-wider">Marketplace</span>
        </div>
        <h1 className="text-3xl font-bold">Discover IP Assets</h1>
        <p className="text-muted-foreground">
          Browse, buy, and license creative works on Starknet — gasless for everyone.
        </p>
        <PlatformStatsBar />
      </div>

      {/* Filter toolbar */}
      <div className="space-y-3 pb-3 border-b border-border/60">
        {/* Row 1: search + filter toggle */}
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <SearchBar />
          </div>
          <button
            onClick={() => setFiltersOpen((v) => !v)}
            className={cn(
              "relative flex items-center gap-1.5 h-9 px-3 rounded-lg border text-xs font-medium transition-colors shrink-0",
              filtersOpen || filterCount > 0
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
            )}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Filters
            {filterCount > 0 && (
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                {filterCount}
              </span>
            )}
          </button>
        </div>

        {/* Row 2: sort tabs — always visible */}
        <div className="flex items-center gap-1">
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setSort(opt.value)}
              className={`text-xs px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
                sort === opt.value
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Expandable filter panel */}
        {filtersOpen && (
          <div className="rounded-xl border border-border bg-muted/20 p-3 space-y-3">
            {/* Type */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground w-12 shrink-0">Type</span>
              <div className="flex items-center gap-1 flex-wrap">
                {TYPE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setOrderType(opt.value)}
                    className={`text-xs px-3 py-1 rounded-full border transition-colors whitespace-nowrap ${
                      orderType === opt.value
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:border-primary/50"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Currency */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground w-12 shrink-0">Token</span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {CURRENCY_OPTIONS.map((c) => (
                  <button
                    key={c}
                    onClick={() => handleCurrencyChange(c)}
                    className={`text-xs px-2.5 py-1 rounded-full border transition-colors whitespace-nowrap ${
                      currency === c
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:border-primary/50"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Price range */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground w-12 shrink-0">Price</span>
              <div className="flex items-center gap-1.5">
                <Input
                  placeholder="Min"
                  value={minInput}
                  onChange={(e) => handlePriceInput(e.target.value, maxInput)}
                  className="h-7 w-20 text-xs px-2"
                  type="number"
                  min="0"
                />
                <span className="text-xs text-muted-foreground">–</span>
                <Input
                  placeholder="Max"
                  value={maxInput}
                  onChange={(e) => handlePriceInput(minInput, e.target.value)}
                  className="h-7 w-20 text-xs px-2"
                  type="number"
                  min="0"
                />
              </div>
            </div>

            {/* IP Type */}
            <div className="flex flex-wrap items-start gap-2 pt-1 border-t border-border/60">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground w-12 shrink-0 pt-1">IP Type</span>
              <div className="flex flex-wrap gap-1.5">
                <IpTypeChip href="/marketplace" label="All" />
                {IP_TYPES.map((type) => (
                  <IpTypeChip key={type} href={`/${type.toLowerCase()}`} label={type} />
                ))}
              </div>
            </div>

            {hasFilters && (
              <div className="pt-1 border-t border-border/60">
                <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground" onClick={resetAll}>
                  Clear all filters
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Grid */}
      <ListingsGrid
        sort={sort}
        currency={currency ? getTokenBySymbol(currency)?.address : undefined}
        orderType={orderType}
        minPrice={minPrice}
        maxPrice={maxPrice}
      />
    </div>
  );
}
