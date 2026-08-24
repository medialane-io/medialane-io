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
      <div data-testid="nft-strip-skeleton" className="grid grid-cols-2 gap-2.5">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="aspect-square animate-pulse rounded-2xl bg-foreground/[0.06]" />
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
    <div className="grid grid-cols-2 gap-2.5">
      {items.map((item) => {
        const resolved = resolveTokenImage(item.image);
        return (
          <Link
            key={item.key}
            href={item.href}
            className="group overflow-hidden rounded-2xl bg-card/40 backdrop-blur-sm transition-colors hover:bg-card/60"
          >
            <div className="relative aspect-square w-full overflow-hidden bg-foreground/[0.06]">
              {resolved ? (
                <Image
                  src={resolved}
                  alt=""
                  fill
                  unoptimized
                  className="object-cover transition-transform duration-200 group-hover:scale-[1.03]"
                />
              ) : (
                <div className="grid h-full w-full place-items-center">
                  <AssetFallbackIcon />
                </div>
              )}
            </div>
            <div className="min-w-0 px-2.5 py-2">
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
