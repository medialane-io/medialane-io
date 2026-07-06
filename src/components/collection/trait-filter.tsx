"use client";

import { useMemo, useState } from "react";
import { SlidersHorizontal, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import type { ApiToken } from "@medialane/sdk";

interface TraitFilterProps {
  tokens: ApiToken[];
  selected: Record<string, string[]>;
  onChange: (filters: Record<string, string[]>) => void;
}

interface TraitSection {
  traitType: string;
  values: { value: string; count: number }[];
}

export function TraitFilter({ tokens, selected, onChange }: TraitFilterProps) {
  const [open, setOpen] = useState(false);

  // Build trait map with value counts from loaded tokens, then drop any
  // trait type where every token shares the same single value — a filter
  // that can never narrow the result set is just noise.
  const traitSections: TraitSection[] = useMemo(() => {
    const map = new Map<string, Map<string, number>>();
    for (const token of tokens) {
      const attrs = Array.isArray(token.metadata?.attributes)
        ? (token.metadata.attributes as { trait_type?: string; value?: string }[])
        : [];
      for (const attr of attrs) {
        if (!attr.trait_type || attr.value == null) continue;
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

  if (traitSections.length === 0) return null;

  const activeEntries = Object.entries(selected).flatMap(([traitType, values]) =>
    values.map((value) => ({ traitType, value }))
  );
  const activeCount = activeEntries.length;

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
          {activeCount > 0 && (
            <span className="h-4 min-w-4 rounded-full bg-primary text-[10px] font-bold text-primary-foreground flex items-center justify-center px-1 -mr-1">
              {activeCount}
            </span>
          )}
        </Button>

        {/* Active filter pills — one per selected value */}
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

        {activeCount > 1 && (
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
              {activeCount > 0 && (
                <Badge variant="secondary" className="text-[11px] font-medium">
                  {activeCount} active
                </Badge>
              )}
            </DialogTitle>
            {activeCount > 0 && (
              <button
                onClick={clearAll}
                className="text-[11px] text-muted-foreground hover:text-foreground underline-offset-2 hover:underline transition-colors"
              >
                Clear all
              </button>
            )}
          </div>

          {/* Trait sections — always expanded (pruning already removed the noise) */}
          <div className="flex-1 overflow-y-auto px-5 py-3 space-y-4">
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
          </div>

          {/* Footer */}
          <div className="px-5 pt-3 pb-5 border-t border-border/60 shrink-0">
            <button
              className="w-full h-11 rounded-[11px] bg-brand-purple text-white text-sm font-semibold flex items-center justify-center gap-2 hover:brightness-110 active:scale-[0.98] transition-all"
              onClick={() => setOpen(false)}
            >
              {activeCount > 0
                ? `Show results (${activeCount} filter${activeCount > 1 ? "s" : ""})`
                : "Close"}
            </button>
          </div>

        </DialogContent>
      </Dialog>
    </>
  );
}
