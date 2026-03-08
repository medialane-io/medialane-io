"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, Loader2 } from "lucide-react";
import { MotionCard } from "@/components/ui/motion-primitives";
import { ipfsToHttp, formatDisplayPrice } from "@/lib/utils";
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
    <MotionCard className="card-base group">
      <Link href={`/collections/${collection.contractAddress}`} className="block relative h-full">
        {/* Main Image Area */}
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
          {/* Vivid Image with Hover Effect */}
          {showImage ? (
            <Image
              src={imageUrl}
              alt={collection.name ?? "Collection"}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-110"
              onError={() => setImgError(true)}
              unoptimized
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-brand-purple/25 via-brand-blue/15 to-brand-navy/30 flex items-center justify-center transition-transform duration-500 group-hover:scale-110">
              <span className="text-7xl font-black text-white/10 select-none tracking-tighter">
                {initial}
              </span>
            </div>
          )}

          {/* Avant-garde Glass Overlay */}
          <div className="absolute inset-x-2 bottom-2 glass rounded-xl p-3 space-y-2 border border-white/10 shadow-xl backdrop-blur-md">
            {/* Header: Name + Badge */}
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  {!collection.name && collection.metadataStatus === "PENDING" ? (
                    <span className="flex items-center gap-1.5 text-[10px] text-white/60">
                      <Loader2 className="h-2.5 w-2.5 animate-spin" />
                      Indexing…
                    </span>
                  ) : (
                    <p className="font-bold text-sm truncate leading-snug text-white">
                      {collection.name ?? "Unnamed Collection"}
                    </p>
                  )}
                  {collection.isKnown && (
                    <CheckCircle2 className="h-3.5 w-3.5 text-brand-blue shrink-0" />
                  )}
                </div>
                {collection.symbol && (
                  <p className="text-[10px] text-white/50 mt-0.5 font-mono">
                    {collection.symbol}
                  </p>
                )}
              </div>
            </div>

            {/* Price section - compact */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <p className="section-label !text-[8px] !text-white/40 !tracking-widest">Items</p>
                  <p className="text-[11px] font-bold text-white mt-0.5">
                    {collection.totalSupply?.toLocaleString() ?? "—"}
                  </p>
                </div>
                <div className="text-center">
                  <p className="section-label !text-[8px] !text-white/40 !tracking-widest">Holders</p>
                  <p className="text-[11px] font-bold text-white mt-0.5">
                    {collection.holderCount?.toLocaleString() ?? "—"}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="section-label !text-[8px] !text-white/40 !tracking-widest">Floor</p>
                <p className={`text-[11px] font-black mt-0.5 ${hasFloor ? "text-primary" : "text-white"}`}>
                  {formatDisplayPrice(collection.floorPrice) || "—"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </MotionCard>
  );
}

export function CollectionCardSkeleton() {
  return (
    <div className="card-base">
      <Skeleton className="aspect-[16/7] w-full rounded-none" />
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
