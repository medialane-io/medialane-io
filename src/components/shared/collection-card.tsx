"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, Loader2 } from "lucide-react";
import { ipfsToHttp } from "@/lib/utils";
import type { ApiCollection } from "@medialane/sdk";

interface CollectionCardProps {
  collection: ApiCollection;
}

export function CollectionCard({ collection }: CollectionCardProps) {
  const [imgError, setImgError] = useState(false);
  const imageUrl = collection.image ? ipfsToHttp(collection.image) : null;
  const showImage = imageUrl && !imgError;
  const initial = (collection.name ?? collection.contractAddress).charAt(0).toUpperCase();
  const hasFloor = !!collection.floorPrice;

  return (
    <Link href={`/collections/${collection.contractAddress}`} className="block group">
      <div className="rounded-2xl border border-border bg-card overflow-hidden asset-card-hover card-glow hover:border-primary/30">
        {/* Cover image */}
        <div className="relative aspect-[16/7] w-full overflow-hidden">
          {showImage ? (
            <Image
              src={imageUrl}
              alt={collection.name ?? "Collection"}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              onError={() => setImgError(true)}
              unoptimized
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-purple-500/15 to-blue-500/10 flex items-center justify-center">
              <span className="text-7xl font-black text-primary/15 select-none tracking-tighter">
                {initial}
              </span>
            </div>
          )}
          {/* Bottom fade so text reads over any image */}
          <div className="absolute inset-0 bg-gradient-to-t from-card/90 via-card/10 to-transparent" />
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          {/* Name row */}
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                {!collection.name && collection.metadataStatus === "PENDING" ? (
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Indexing…
                  </span>
                ) : (
                  <p className="font-semibold text-sm truncate leading-snug">
                    {collection.name ?? "Unnamed Collection"}
                  </p>
                )}
                {collection.isKnown && (
                  <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
                )}
              </div>
              {collection.symbol && (
                <p className="text-[11px] text-muted-foreground mt-0.5 font-mono">{collection.symbol}</p>
              )}
            </div>
          </div>

          {/* Description */}
          {collection.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
              {collection.description}
            </p>
          )}

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-xl bg-muted/50 p-2 text-center">
              <p className="section-label">Items</p>
              <p className="text-xs font-bold mt-0.5">
                {collection.totalSupply?.toLocaleString() ?? "—"}
              </p>
            </div>
            <div className="rounded-xl bg-muted/50 p-2 text-center">
              <p className="section-label">Holders</p>
              <p className="text-xs font-bold mt-0.5">
                {collection.holderCount?.toLocaleString() ?? "—"}
              </p>
            </div>
            <div className="rounded-xl bg-muted/50 p-2 text-center">
              <p className="section-label">Floor</p>
              <p className={`text-xs font-bold mt-0.5 ${hasFloor ? "price-value" : ""}`}>
                {collection.floorPrice ?? "—"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

export function CollectionCardSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <Skeleton className="aspect-[16/7] w-full" />
      <div className="p-4 space-y-3">
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-3 w-1/3" />
        </div>
        <Skeleton className="h-3 w-full" />
        <div className="grid grid-cols-3 gap-2">
          <Skeleton className="h-10 rounded-xl" />
          <Skeleton className="h-10 rounded-xl" />
          <Skeleton className="h-10 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
