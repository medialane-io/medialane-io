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
        {/* Image area */}
        <div className="relative aspect-[3/4] w-full overflow-hidden bg-muted">
          {showImage ? (
            <Image
              src={imageUrl}
              alt={collection.name ?? "Collection"}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              onError={() => setImgError(true)}
              unoptimized
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-brand-purple/30 via-brand-blue/20 to-brand-navy/40 flex items-center justify-center">
              <span className="text-8xl font-black text-white/10 select-none tracking-tighter">
                {initial}
              </span>
            </div>
          )}

          {/* Glass info strip — no gradient overlay, artwork shows at full fidelity */}
          <div className="absolute bottom-0 left-0 right-0 bg-black/45 backdrop-blur-md px-3 pb-3 pt-2.5">
            {/* Name row */}
            <div className="flex items-center gap-1.5 mb-1">
              {!collection.name && collection.metadataStatus === "PENDING" ? (
                <span className="flex items-center gap-1 text-[10px] text-white/60">
                  <Loader2 className="h-2.5 w-2.5 animate-spin" />
                  Indexing…
                </span>
              ) : (
                <p className="font-bold text-sm truncate text-white leading-tight group-hover:text-white/90 transition-colors">
                  {collection.name ?? "Unnamed Collection"}
                </p>
              )}
              {collection.isKnown && (
                <CheckCircle2 className="h-3.5 w-3.5 text-blue-400 shrink-0" />
              )}
            </div>

            {/* Stats row */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {collection.totalSupply != null && (
                <span className="text-[10px] font-medium text-white/55">
                  {collection.totalSupply.toLocaleString()} items
                </span>
              )}
              {collection.totalSupply != null && hasFloor && (
                <span className="text-[10px] text-white/25">·</span>
              )}
              {hasFloor && (
                <span className="text-[10px] font-bold text-white/90">
                  Floor {formatDisplayPrice(collection.floorPrice)}
                </span>
              )}
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
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-muted rounded-none">
        <Skeleton className="absolute inset-0 rounded-none" />
        <div className="absolute bottom-3 left-3 right-3 space-y-1.5">
          <Skeleton className="h-4 w-2/3 rounded-md" />
          <Skeleton className="h-3 w-1/3 rounded-md" />
        </div>
      </div>
    </div>
  );
}
