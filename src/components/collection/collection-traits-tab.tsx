"use client";

import { useState, useEffect } from "react";
import { useCollectionTokens } from "@/hooks/use-collections";
import { useCollectionFilters } from "@medialane/ui";
import type { ApiToken } from "@medialane/sdk";
import { Sparkles } from "lucide-react";

const FETCH_PAGE_SIZE = 100;
// Rarity is a nice-to-have stat, not settlement data — cap the crawl so a
// very large collection doesn't turn this tab into an unbounded fetch loop.
const MAX_TOKENS_FOR_RARITY = 2000;

export function CollectionTraitsTab({ contract }: { contract: string }) {
  const [page, setPage] = useState(1);
  const [all, setAll] = useState<ApiToken[]>([]);
  const { tokens, meta, isLoading } = useCollectionTokens(contract, page, FETCH_PAGE_SIZE, "recent");

  useEffect(() => {
    if (tokens.length === 0) return;
    setAll((prev) => (page === 1 ? tokens : [...prev, ...tokens]));
  }, [tokens, page]);

  useEffect(() => {
    const total = Math.min(meta?.total ?? 0, MAX_TOKENS_FOR_RARITY);
    if (!isLoading && all.length > 0 && all.length < total) setPage((p) => p + 1);
  }, [isLoading, all.length, meta?.total]);

  const { traitSections } = useCollectionFilters(all, {}, () => {}, "recent", () => {});
  const sampleSize = all.length;
  const stillLoading = isLoading || (meta?.total != null && sampleSize < Math.min(meta.total, MAX_TOKENS_FOR_RARITY));

  if (traitSections.length === 0 && !stillLoading) {
    return (
      <div className="py-20 flex flex-col items-center gap-3 text-center">
        <Sparkles className="h-10 w-10 text-muted-foreground/40" />
        <p className="text-sm font-medium text-muted-foreground">No traits found</p>
        <p className="text-xs text-muted-foreground/70 max-w-xs">
          Items in this collection don&apos;t carry attribute metadata yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {stillLoading && (
        <p className="text-xs text-muted-foreground">Reading trait data — rarity updates as more items load…</p>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {traitSections.map((section) => (
          <div key={section.traitType} className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{section.traitType}</p>
            <div className="space-y-1.5">
              {section.values.map(({ value, count }) => {
                const pct = sampleSize > 0 ? Math.round((count / sampleSize) * 1000) / 10 : 0;
                return (
                  <div key={value} className="flex items-center justify-between gap-3 rounded-lg bg-muted/50 px-3 py-2">
                    <span className="text-sm font-medium truncate">{value}</span>
                    <span className="text-xs font-bold tabular-nums text-muted-foreground shrink-0">
                      {count} · {pct}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
