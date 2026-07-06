"use client";

import { useMemo, useState } from "react";
import { SlidersHorizontal, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import type { ApiToken, CollectionTokensSort } from "@medialane/sdk";

// Trait types that are per-token stamps rather than real categories — never
// useful as a filter regardless of how many distinct values they have.
// "Registration" is the Berne Convention registration date, near-unique per
// mint; filtering by an exact date isn't a meaningful narrowing action.
const EXCLUDED_TRAIT_TYPES = new Set(["registration"]);

const SORT_OPTIONS: { value: CollectionTokensSort; label: string }[] = [
  { value: "recent", label: "Recent" },
  { value: "oldest", label: "Oldest" },
  { value: "name", label: "Name" },
  { value: "price", label: "Price" },
];

interface CollectionFiltersProps {
  tokens: ApiToken[];
  selected: Record<string, string[]>;
  onChange: (filters: Record<string, string[]>) => void;
  sort: CollectionTokensSort;
  onSortChange: (sort: CollectionTokensSort) => void;
}

interface TraitSection {
  traitType: string;
  values: { value: string; count: number }[];
}

export function CollectionFilters({
  tokens,
  selected,
  onChange,
  sort,
  onSortChange,
}: CollectionFiltersProps) {
  const [open, setOpen] = useState(false);

  // Build trait map with value counts from loaded tokens, then drop any
  // trait type where every token shares the same single value (can never
  // narrow the result set) or that's a known per-token stamp, not a category.
  const traitSections: TraitSection[] = useMemo(() => {
    const map = new Map<string, Map<string, number>>();
    for (const token of tokens) {
      const attrs = Array.isArray(token.metadata?.attributes)
        ? (token.metadata.attributes as { trait_type?: string; value?: string }[])
        : [];
      for (const attr of attrs) {
        if (!attr.trait_type || attr.value == null) continue;
        if (EXCLUDED_TRAIT_TYPES.has(attr.trait_type.toLowerCase())) continue;
        if (!map.has(attr.trait_type)) map.set(attr.trait_type, new Map());
        const counts = map.get(attr.trait_type)!;
        const v = String(attr.value);
        counts.set(v, (counts.get(v) ?? 0) + 1);
      }
    }
    return Array.from(map.entries())
      .map(([traitType, counts]) => ({
        traitType,
        values: Array.from(counts.entries())
          .map(([value, count]) => ({ value, count }))
          .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value)),
      }))
      .filter((section) => section.values.length >= 2);
  }, [tokens]);

  const activeEntries = Object.entries(selected).flatMap(([traitType, values]) =>
    values.map((value) => ({ traitType, value }))
  );
  const traitActiveCount = activeEntries.length;
  const sortIsDefault = sort === "recent";
  const totalActiveCount = traitActiveCount + (sortIsDefault ? 0 : 1);

  function toggleValue(traitType: string, value: string) {
    const current = selected[traitType] ?? [];
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    const nextSelected = { ...selected };
    if (next.length === 0) {
      delete nextSelected[traitType];
    } else {
      nextSelected[traitType] = next;
    }
    onChange(nextSelected);
  }

  function clearAll() {
    onChange({});
    onSortChange("recent");
  }

  function removeFilter(traitType: string, value: string) {
    toggleValue(traitType, value);
  }

  return (
    <>
      {/* Trigger row — right-aligned above the grid */}
      <div className="flex items-center justify-end gap-2 flex-wrap">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setOpen(true)}
          className="h-8 gap-2 shrink-0"
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Filters
          {totalActiveCount > 0 && (
            <span className="h-4 min-w-4 rounded-full bg-primary text-[10px] font-bold text-primary-foreground flex items-center justify-center px-1 -mr-1">
              {totalActiveCount}
            </span>
          )}
        </Button>

        {/* Sort pill — only shown when not the default */}
        {!sortIsDefault && (
          <button
            onClick={() => onSortChange("recent")}
            className="inline-flex items-center gap-1 h-8 px-2.5 rounded-md border border-primary/40 bg-primary/10 text-xs font-medium text-foreground hover:bg-primary/20 transition-colors"
          >
            <span className="text-muted-foreground text-[11px]">Sort:</span>
            <span>{SORT_OPTIONS.find((o) => o.value === sort)?.label}</span>
            <X className="h-3 w-3 text-muted-foreground ml-0.5" />
          </button>
        )}

        {/* Active trait pills — one per selected value */}
        {activeEntries.map(({ traitType, value }) => (
          <button
            key={`${traitType}:${value}`}
            onClick={() => removeFilter(traitType, value)}
            className="inline-flex items-center gap-1 h-8 px-2.5 rounded-md border border-primary/40 bg-primary/10 text-xs font-medium text-foreground hover:bg-primary/20 transition-colors"
          >
            <span className="text-muted-foreground text-[11px]">{traitType}:</span>
            <span>{value}</span>
            <X className="h-3 w-3 text-muted-foreground ml-0.5" />
          </button>
        ))}

        {totalActiveCount > 1 && (
          <button
            onClick={clearAll}
            className="text-xs text-muted-foreground hover:text-foreground underline-offset-2 hover:underline transition-colors"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Filter panel */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-full max-w-sm p-0 overflow-hidden gap-0 flex flex-col max-h-[85svh]">

          {/* Header */}
          <div className="flex items-center justify-between pr-10 pl-5 py-4 border-b border-border/60 shrink-0">
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4" />
              Filters
              {totalActiveCount > 0 && (
                <Badge variant="secondary" className="text-[11px] font-medium">
                  {totalActiveCount} active
                </Badge>
              )}
            </DialogTitle>
            {totalActiveCount > 0 && (
              <button
                onClick={clearAll}
                className="text-[11px] text-muted-foreground hover:text-foreground underline-offset-2 hover:underline transition-colors"
              >
                Clear all
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-3 space-y-4">
            {/* Sort section */}
            <div>
              <div className="mb-2">
                <span className="text-sm font-medium">Sort by</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {SORT_OPTIONS.map(({ value, label }) => {
                  const isSelected = sort === value;
                  return (
                    <button
                      key={value}
                      onClick={() => onSortChange(value)}
                      className={`inline-flex items-center gap-1 h-7 px-2.5 rounded-full border text-[12px] font-medium transition-colors ${
                        isSelected
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-transparent text-muted-foreground hover:text-foreground hover:border-foreground/30"
                      }`}
                    >
                      {isSelected && <Check className="h-3 w-3" />}
                      <span>{label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Trait sections — always expanded (pruning already removed the noise) */}
            {traitSections.length > 0 && (
              <>
                <Separator />
                {traitSections.map((section, i) => {
                  const activeValues = selected[section.traitType] ?? [];
                  return (
                    <div key={section.traitType}>
                      {i > 0 && <Separator className="mb-4" />}
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">{section.traitType}</span>
                        <span className="text-[11px] text-muted-foreground">
                          {section.values.length} values
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {section.values.map(({ value, count }) => {
                          const isSelected = activeValues.includes(value);
                          return (
                            <button
                              key={value}
                              onClick={() => toggleValue(section.traitType, value)}
                              className={`inline-flex items-center gap-1 h-7 px-2.5 rounded-full border text-[12px] font-medium transition-colors ${
                                isSelected
                                  ? "border-primary bg-primary text-primary-foreground"
                                  : "border-border bg-transparent text-muted-foreground hover:text-foreground hover:border-foreground/30"
                              }`}
                            >
                              {isSelected && <Check className="h-3 w-3" />}
                              <span>{value}</span>
                              <span className={isSelected ? "opacity-80" : "opacity-60"}>
                                {count}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="px-5 pt-3 pb-5 border-t border-border/60 shrink-0">
            <button
              className="w-full h-11 rounded-[11px] bg-brand-purple text-white text-sm font-semibold flex items-center justify-center gap-2 hover:brightness-110 active:scale-[0.98] transition-all"
              onClick={() => setOpen(false)}
            >
              {totalActiveCount > 0
                ? `Show results (${totalActiveCount} filter${totalActiveCount > 1 ? "s" : ""})`
                : "Close"}
            </button>
          </div>

        </DialogContent>
      </Dialog>
    </>
  );
}
