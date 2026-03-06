"use client";

export const dynamic = "force-dynamic";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { ListingsGrid } from "@/components/marketplace/listings-grid";
import { FilterSidebar } from "@/components/marketplace/filter-sidebar";
import { useMedialaneClient } from "@/hooks/use-medialane-client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Sparkles, Search, X, SlidersHorizontal } from "lucide-react";
import type { ApiSearchResult } from "@medialane/sdk";
import Link from "next/link";

function SearchBar() {
  const client = useMedialaneClient();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ApiSearchResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [open, setOpen] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

  const handleChange = (value: string) => {
    setQuery(value);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (!value.trim()) {
      setResults(null);
      setOpen(false);
      return;
    }
    timeoutRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await client.api.search(value.trim(), 8);
        setResults(res.data);
        setOpen(true);
      } catch {
        // ignore search errors
      } finally {
        setIsSearching(false);
      }
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
    <div className="relative max-w-md w-full">
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

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Hero */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-primary">
            <Sparkles className="h-5 w-5" />
            <span className="text-sm font-semibold uppercase tracking-wider">Marketplace</span>
          </div>
          <h1 className="text-3xl font-bold">Discover IP Assets</h1>
          <p className="text-muted-foreground">
            Browse, buy, and license creative works on Starknet — gasless for everyone.
          </p>
        </div>
        <SearchBar />
      </div>

      {/* Mobile filter button */}
      <div className="md:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <SlidersHorizontal className="h-4 w-4" />
              Filters
              {(sort !== "recent" || currency || orderType) && (
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72">
            <SheetHeader>
              <SheetTitle>Filters</SheetTitle>
            </SheetHeader>
            <div className="mt-6 px-1">
              <FilterSidebar
                sort={sort}
                currency={currency}
                orderType={orderType}
                onSortChange={setSort}
                onCurrencyChange={setCurrency}
                onOrderTypeChange={setOrderType}
                onReset={() => { setSort("recent"); setCurrency(""); setOrderType(""); }}
              />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Filter + Grid */}
      <div className="flex gap-8">
        <aside className="hidden md:block w-52 shrink-0">
          <FilterSidebar
            sort={sort}
            currency={currency}
            orderType={orderType}
            onSortChange={setSort}
            onCurrencyChange={setCurrency}
            onOrderTypeChange={setOrderType}
            onReset={() => { setSort("recent"); setCurrency(""); setOrderType(""); }}
          />
        </aside>
        <div className="flex-1 min-w-0">
          <ListingsGrid sort={sort} currency={currency || undefined} orderType={orderType} />
        </div>
      </div>
    </div>
  );
}
