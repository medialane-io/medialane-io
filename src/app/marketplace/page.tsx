"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { ListingsGrid } from "@/components/marketplace/listings-grid";
import { FilterSidebar } from "@/components/marketplace/filter-sidebar";
import { Sparkles } from "lucide-react";

export default function MarketplacePage() {
  const [sort, setSort] = useState("recent");
  const [currency, setCurrency] = useState("");

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Hero */}
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

      {/* Filter + Grid */}
      <div className="flex gap-8">
        <aside className="hidden md:block w-52 shrink-0">
          <FilterSidebar
            sort={sort}
            currency={currency}
            onSortChange={setSort}
            onCurrencyChange={setCurrency}
            onReset={() => { setSort("recent"); setCurrency(""); }}
          />
        </aside>
        <div className="flex-1 min-w-0">
          <ListingsGrid sort={sort} currency={currency || undefined} />
        </div>
      </div>
    </div>
  );
}
