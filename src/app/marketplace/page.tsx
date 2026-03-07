"use client";

export const dynamic = "force-dynamic";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ListingsGrid } from "@/components/marketplace/listings-grid";
import { useMedialaneClient } from "@/hooks/use-medialane-client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Sparkles, Search, X } from "lucide-react";
import type { ApiSearchResult } from "@medialane/sdk";
import Link from "next/link";

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

const CURRENCY_OPTIONS = ["USDC", "USDT", "STRK", "ETH"];

function SearchBar() {
  const client = useMedialaneClient();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ApiSearchResult | null>(null);
  const [open, setOpen] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

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
              {results.collections!.map((c) => (
                <Link
                  key={c.contractAddress}
                  href={`/collections/${c.contractAddress}`}
                  className="flex items-center gap-3 px-3 py-2.5 hover:bg-muted/50 transition-colors"
                >
                  <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center text-xs font-bold shrink-0">
                    {c.name?.charAt(0) ?? "?"}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{c.name}</p>
                    <p className="text-xs text-muted-foreground font-mono truncate">{c.contractAddress.slice(0, 14)}…</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function MarketplacePage() {
  const [sort, setSort] = useState("recent");
  const [currency, setCurrency] = useState("");
  const [orderType, setOrderType] = useState("");
  const [minInput, setMinInput] = useState("");
  const [maxInput, setMaxInput] = useState("");
  const [minPrice, setMinPrice] = useState<string | undefined>();
  const [maxPrice, setMaxPrice] = useState<string | undefined>();
  const priceDebounce = useRef<ReturnType<typeof setTimeout>>(null);

  const handlePriceInput = (min: string, max: string) => {
    setMinInput(min);
    setMaxInput(max);
    if (priceDebounce.current) clearTimeout(priceDebounce.current);
    priceDebounce.current = setTimeout(() => {
      setMinPrice(min.trim() || undefined);
      setMaxPrice(max.trim() || undefined);
    }, 400);
  };

  const hasFilters = sort !== "recent" || currency || orderType || minPrice || maxPrice;

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
    <div className="px-4 py-8 space-y-6">
      {/* Hero */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-primary">
          <Sparkles className="h-4 w-4" />
          <span className="text-xs font-semibold uppercase tracking-wider">Marketplace</span>
        </div>
        <h1 className="text-2xl font-bold">Discover IP Assets</h1>
        <p className="text-sm text-muted-foreground">
          Browse, buy, and license creative works on Starknet — gasless for everyone.
        </p>
      </div>

      {/* Filter toolbar */}
      <div className="space-y-3 pb-2 border-b border-border/60">
        {/* Row 1: search */}
        <SearchBar />

        {/* Row 2: scrollable filter chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {/* Sort */}
          <div className="flex items-center gap-1 shrink-0">
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

          <div className="w-px h-5 bg-border shrink-0" />

          {/* Type */}
          <div className="flex items-center gap-1 shrink-0">
            {TYPE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setOrderType(opt.value)}
                className={`text-xs px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
                  orderType === opt.value
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="w-px h-5 bg-border shrink-0" />

          {/* Currency */}
          <div className="flex items-center gap-1.5 shrink-0">
            {CURRENCY_OPTIONS.map((c) => (
              <button
                key={c}
                onClick={() => setCurrency(currency === c ? "" : c)}
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

          <div className="w-px h-5 bg-border shrink-0" />

          {/* Price range */}
          <div className="flex items-center gap-1.5 shrink-0">
            <Input
              placeholder="Min"
              value={minInput}
              onChange={(e) => handlePriceInput(e.target.value, maxInput)}
              className="h-7 w-16 text-xs px-2"
              type="number"
              min="0"
            />
            <span className="text-xs text-muted-foreground">–</span>
            <Input
              placeholder="Max"
              value={maxInput}
              onChange={(e) => handlePriceInput(minInput, e.target.value)}
              className="h-7 w-16 text-xs px-2"
              type="number"
              min="0"
            />
          </div>

          {/* Reset */}
          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-muted-foreground shrink-0 ml-auto"
              onClick={resetAll}
            >
              Reset
            </Button>
          )}
        </div>
      </div>

      {/* Grid */}
      <ListingsGrid
        sort={sort}
        currency={currency || undefined}
        orderType={orderType}
        minPrice={minPrice}
        maxPrice={maxPrice}
      />
    </div>
  );
}
