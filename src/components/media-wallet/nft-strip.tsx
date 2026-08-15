"use client";

import Link from "next/link";
import Image from "next/image";
import { resolveTokenImage } from "@/lib/utils";
import type { NftItem } from "./nft-items";

export function NftStrip({
  items,
  isLoading,
}: {
  items: NftItem[];
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div data-testid="nft-strip-skeleton" className="flex flex-col gap-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="h-[68px] animate-pulse rounded-2xl bg-foreground/[0.06]" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No NFTs yet — mint or collect your first one to see it here.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {items.map((item) => {
        const resolved = resolveTokenImage(item.image);
        return (
          <Link
            key={item.key}
            href={item.href}
            className="flex items-center gap-3 rounded-2xl bg-card/40 px-4 py-3 backdrop-blur-sm transition-colors hover:bg-card/60"
          >
            <div className="relative grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-full bg-foreground/[0.06]">
              {resolved ? (
                <Image src={resolved} alt="" fill unoptimized className="object-cover" />
              ) : (
                <AssetFallbackIcon />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold">{item.name}</div>
              <div className="truncate text-xs text-muted-foreground">{item.ipType ?? "Asset"}</div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

function AssetFallbackIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="text-muted-foreground" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <circle cx="9" cy="9" r="1.5" fill="currentColor" stroke="none" />
      <path d="M21 15l-5-5-9 9" />
    </svg>
  );
}
