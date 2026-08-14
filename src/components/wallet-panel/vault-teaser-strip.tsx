"use client";

import { AssetCard } from "@medialane/ui";
import type { VaultTeaserItem } from "./vault-teaser-items";

export function VaultTeaserStrip({
  items,
  isLoading,
  onViewVault,
}: {
  items: VaultTeaserItem[];
  isLoading: boolean;
  onViewVault: () => void;
}) {
  if (isLoading) {
    return (
      <div data-testid="vault-teaser-skeleton" className="flex gap-3 overflow-x-auto">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-24 w-24 shrink-0 animate-pulse rounded-2xl bg-foreground/[0.06]" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Nothing in your vault yet — mint or collect your first asset to see it here.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-3 overflow-x-auto">
        {items.map((item) => (
          <div key={item.key} className="w-24 shrink-0">
            <AssetCard
              href={item.href}
              name={item.name}
              image={item.image}
              ipType={item.ipType}
              fallbackId={item.fallbackId}
            />
          </div>
        ))}
      </div>
      <button
        onClick={onViewVault}
        className="self-start text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
      >
        View vault →
      </button>
    </div>
  );
}
