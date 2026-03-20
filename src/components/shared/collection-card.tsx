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
        <div className="relative aspect-[3/4] w-full overflow-hidden bg-muted">
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

          {/* Name badge — bottom left */}
          <div className="absolute bottom-2 left-2 right-2 flex items-end justify-between gap-1.5 flex-wrap">
            <div className="flex items-center gap-1 backdrop-blur-md  rounded-lg px-2 py-1 max-w-[70%]">
              {!collection.name && collection.metadataStatus === "PENDING" ? (
                <span className="flex items-center gap-1 text-[10px] text-white/70">
                  <Loader2 className="h-2.5 w-2.5 animate-spin" />
                  Indexing…
                </span>
              ) : (
                <p className="font-bold text-sm truncate text-white leading-tight">
                  {collection.name ?? "Unnamed Collection"}
                </p>
              )}
              {collection.isKnown && (
                <CheckCircle2 className="h-3 w-3 text-brand-blue shrink-0" />
              )}
            </div>

            {/* Stat badges */}
            <div className="flex items-center gap-1">
              {collection.totalSupply != null && (
                <span className="backdrop-blur-md  rounded-lg px-2 py-1 text-[10px] font-semibold text-white/80">
                  {collection.totalSupply.toLocaleString()} items
                </span>
              )}
              {hasFloor && (
                <span className="backdrop-blur-md  rounded-lg px-2 py-1 text-[10px] font-bold text-white">
                  {formatDisplayPrice(collection.floorPrice)}
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
        <div className="absolute bottom-2 left-2 right-2 flex items-end justify-between gap-1.5">
          <Skeleton className="h-6 w-2/3 rounded-lg" />
          <Skeleton className="h-5 w-14 rounded-lg" />
        </div>
      </div>
    </div>
  );
}
