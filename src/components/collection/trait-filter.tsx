"use client";

import { useMemo } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { ApiToken } from "@medialane/sdk";

interface TraitFilterProps {
  tokens: ApiToken[];
  selected: Record<string, string>;
  onChange: (filters: Record<string, string>) => void;
}

export function TraitFilter({ tokens, selected, onChange }: TraitFilterProps) {
  const traitMap = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const token of tokens) {
      const attrs = Array.isArray(token.metadata?.attributes)
        ? (token.metadata.attributes as { trait_type?: string; value?: string }[])
        : [];
      for (const attr of attrs) {
        if (!attr.trait_type || attr.value == null) continue;
        if (!map.has(attr.trait_type)) map.set(attr.trait_type, new Set());
        map.get(attr.trait_type)!.add(String(attr.value));
      }
    }
    return map;
  }, [tokens]);

  if (traitMap.size === 0) return null;

  const hasFilters = Object.keys(selected).length > 0;

  return (
    <div className="flex flex-wrap gap-2 items-center py-1">
      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs text-muted-foreground"
          onClick={() => onChange({})}
        >
          <X className="h-3 w-3 mr-1" />
          Clear filters
        </Button>
      )}
      {Array.from(traitMap.entries()).map(([traitType, values]) => (
        <div key={traitType} className="flex items-center gap-1 flex-wrap">
          <span className="text-[11px] text-muted-foreground/70 font-medium uppercase tracking-wide">
            {traitType}:
          </span>
          {Array.from(values)
            .sort()
            .map((value) => {
              const isActive = selected[traitType] === value;
              return (
                <Badge
                  key={value}
                  variant={isActive ? "default" : "outline"}
                  className="cursor-pointer text-[11px] h-6 px-2 select-none hover:bg-primary/20 transition-colors"
                  onClick={() => {
                    if (isActive) {
                      const next = { ...selected };
                      delete next[traitType];
                      onChange(next);
                    } else {
                      onChange({ ...selected, [traitType]: value });
                    }
                  }}
                >
                  {value}
                </Badge>
              );
            })}
        </div>
      ))}
    </div>
  );
}
