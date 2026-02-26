"use client";

import { Filter, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

const SORT_OPTIONS = [
  { label: "Most recent", value: "recent" },
  { label: "Price: low to high", value: "price_asc" },
  { label: "Price: high to low", value: "price_desc" },
];

const CURRENCY_OPTIONS = ["USDC", "USDT", "STRK", "ETH"];

interface FilterSidebarProps {
  sort?: string;
  currency?: string;
  onSortChange?: (sort: string) => void;
  onCurrencyChange?: (currency: string) => void;
  onReset?: () => void;
}

export function FilterSidebar({
  sort = "recent",
  currency,
  onSortChange,
  onCurrencyChange,
  onReset,
}: FilterSidebarProps) {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-primary" />
          <span className="font-semibold">Filters</span>
        </div>
        <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={onReset}>
          <RotateCcw className="h-3 w-3" />
          Reset
        </Button>
      </div>

      <Separator />

      {/* Sort */}
      <div className="space-y-2">
        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Sort
        </Label>
        <div className="space-y-1">
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onSortChange?.(opt.value)}
              className={`w-full text-left text-sm px-2 py-1.5 rounded-md transition-colors ${
                sort === opt.value
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <Separator />

      {/* Currency */}
      <div className="space-y-2">
        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Currency
        </Label>
        <div className="flex flex-wrap gap-2">
          {CURRENCY_OPTIONS.map((c) => (
            <button
              key={c}
              onClick={() => onCurrencyChange?.(currency === c ? "" : c)}
              className={`text-xs px-3 py-1 rounded-full border transition-colors ${
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
    </div>
  );
}
