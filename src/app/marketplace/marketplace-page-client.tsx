"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ListingsGrid } from "@/components/marketplace/listings-grid";
import { useMedialaneClient } from "@/hooks/use-medialane-client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Search, X, Store, SlidersHorizontal } from "lucide-react";
import { ActivityTicker } from "@/components/shared/activity-ticker";
import type { ApiSearchResult } from "@medialane/sdk";
import { getTokenBySymbol, parseAmount, SUPPORTED_TOKENS } from "@medialane/sdk";
import { ipfsToHttp, cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { usePlatformStats } from "@/hooks/use-stats";
import { IP_TYPES } from "@/types/ip";
import { HelpIcon } from "@/components/ui/help-icon";

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
          placeholder="Search creative works"
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
  const filterCount = [sort !== "recent" ? "sort" : "", currency, orderType, minPrice || maxPrice ? "price" : ""].filter(Boolean).length;

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
          <span className="text-sm font-semibold uppercase tracking-wider">NFT Marketplace</span>
        </div>
        <h1 className="text-3xl font-bold">Discover and trade</h1>
        <PlatformStatsBar />
      </div>

      {/* Live activity ticker */}
      <ActivityTicker limit={12} />

      {/* Filter toolbar */}
      <div className="space-y-2 pb-3 border-b border-border/60">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex-1 min-w-0">
            <SearchBar />
          </div>
          <button
            onClick={() => setFiltersOpen(true)}
            className={cn(
              "relative flex items-center gap-1.5 h-9 px-3 rounded-lg border text-xs font-medium transition-colors shrink-0",
              filterCount > 0
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

        {/* Active filter pills — quick-clear */}
        {hasFilters && (
          <div className="flex flex-wrap gap-1.5">
            {sort !== "recent" && (
              <span className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border border-primary/40 bg-primary/10 text-primary">
                {SORT_OPTIONS.find((o) => o.value === sort)?.label}
                <button onClick={() => setSort("recent")} className="ml-0.5 hover:text-primary/60">×</button>
              </span>
            )}
            {orderType && (
              <span className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border border-primary/40 bg-primary/10 text-primary">
                {TYPE_OPTIONS.find((o) => o.value === orderType)?.label}
                <button onClick={() => setOrderType("")} className="ml-0.5 hover:text-primary/60">×</button>
              </span>
            )}
            {currency && (
              <span className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border border-primary/40 bg-primary/10 text-primary">
                {currency}
                <button onClick={() => handleCurrencyChange(currency)} className="ml-0.5 hover:text-primary/60">×</button>
              </span>
            )}
            {(minPrice || maxPrice) && (
              <span className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border border-primary/40 bg-primary/10 text-primary">
                {minInput || "0"} – {maxInput || "∞"}
                <button onClick={() => { setMinInput(""); setMaxInput(""); setMinPrice(undefined); setMaxPrice(undefined); }} className="ml-0.5 hover:text-primary/60">×</button>
              </span>
            )}
          </div>
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
            {hasFilters && (
              <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground" onClick={() => { resetAll(); }}>
                Clear all
              </Button>
            )}
          </div>

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">

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

            {/* Type */}
            <div className="space-y-2">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Order type</p>
              <div className="flex flex-wrap gap-1.5">
                {TYPE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setOrderType(opt.value)}
                    className={cn(
                      "text-xs px-3 py-1.5 rounded-full border transition-colors whitespace-nowrap",
                      orderType === opt.value
                        ? "border-primary bg-primary/10 text-primary font-medium"
                        : "border-border text-muted-foreground hover:border-primary/50"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Currency */}
            <div className="space-y-2">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Currency</p>
              <div className="flex flex-wrap gap-1.5">
                {CURRENCY_OPTIONS.map((c) => (
                  <button
                    key={c}
                    onClick={() => handleCurrencyChange(c)}
                    className={cn(
                      "text-xs px-3 py-1.5 rounded-full border transition-colors whitespace-nowrap",
                      currency === c
                        ? "border-primary bg-primary/10 text-primary font-medium"
                        : "border-border text-muted-foreground hover:border-primary/50"
                    )}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Price range */}
            <div className="space-y-2">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Price range</p>
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Min"
                  value={minInput}
                  onChange={(e) => handlePriceInput(e.target.value, maxInput)}
                  className="h-9 text-sm"
                  type="number"
                  min="0"
                />
                <span className="text-sm text-muted-foreground shrink-0">–</span>
                <Input
                  placeholder="Max"
                  value={maxInput}
                  onChange={(e) => handlePriceInput(minInput, e.target.value)}
                  className="h-9 text-sm"
                  type="number"
                  min="0"
                />
              </div>
            </div>

            {/* IP Type */}
            <div className="space-y-2 pt-1 border-t border-border/60">
              <p className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                IP Type
                <HelpIcon content="Filter by intellectual property category — Art, Audio, Video, Software, and more" side="right" />
              </p>
              <div className="flex flex-wrap gap-1.5">
                <IpTypeChip href="/marketplace" label="All" />
                {IP_TYPES.map((type) => (
                  <IpTypeChip key={type} href={`/${type.toLowerCase()}`} label={type} />
                ))}
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
