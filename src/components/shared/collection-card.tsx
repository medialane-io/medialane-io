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

          {/* Floating badges — no bar, each element gets its own blur */}
          <div className="absolute bottom-0 left-0 right-0 px-2.5 pb-2.5 flex flex-col gap-1.5 items-start">
            {/* Name badge */}
            {!collection.name && collection.metadataStatus === "PENDING" ? (
              <span className="flex items-center gap-1 text-[10px] text-white/60 backdrop-blur-md bg-black/30 rounded-full px-2 py-0.5">
                <Loader2 className="h-2.5 w-2.5 animate-spin" />
                Indexing…
              </span>
            ) : (
              <p
                className="font-bold text-sm text-white leading-tight backdrop-blur-md bg-black/30 rounded-lg px-2.5 py-1 max-w-full truncate"
                style={{ textShadow: "0 1px 6px rgba(0,0,0,0.5)" }}
              >
                {collection.name ?? "Unnamed Collection"}
                {collection.isKnown && (
                  <CheckCircle2 className="inline-block h-3 w-3 text-blue-400 ml-1.5 shrink-0 align-middle" />
                )}
              </p>
            )}

            {/* Stats badges */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {collection.totalSupply != null && (
                <span className="text-[10px] font-medium text-white/80 backdrop-blur-md bg-black/30 rounded-full px-2 py-0.5">
                  {collection.totalSupply.toLocaleString()} items
                </span>
              )}
              {hasFloor && (
                <span className="text-[10px] font-bold text-white/90 backdrop-blur-md bg-black/30 rounded-full px-2 py-0.5">
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
