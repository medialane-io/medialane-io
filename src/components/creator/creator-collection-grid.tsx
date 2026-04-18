"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDisplayPrice, ipfsToHttp } from "@/lib/utils";
import { HelpIcon } from "@/components/ui/help-icon";
import type { ApiCollection } from "@medialane/sdk";

function CollectionCover({
  collection,
}: {
  collection: ApiCollection;
}) {
  const [imgError, setImgError] = useState(false);
  const imageUrl = collection.image ? ipfsToHttp(collection.image) : null;
  const showImage = imageUrl && !imgError;
  const initial = (collection.name ?? collection.contractAddress).charAt(0).toUpperCase();

  return (
    <Link
      href={`/collections/${collection.contractAddress}`}
      className="group block relative rounded-2xl overflow-hidden border border-border/60 hover:border-border transition-all hover:shadow-xl hover:shadow-black/20 hover:-translate-y-0.5 duration-300"
    >
      {/* Cover image — aspect-[3/4] portrait like collection cards */}
      <div className="relative aspect-[3/4] w-full bg-muted overflow-hidden">
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
            <span className="text-7xl font-black text-white/10 select-none tracking-tighter">
              {initial}
            </span>
          </div>
        )}

        {/* Gradient fade at bottom */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        {/* Floating info */}
        <div className="absolute bottom-0 left-0 right-0 p-3 space-y-1">
          {/* Name */}
          {!collection.name && collection.metadataStatus === "PENDING" ? (
            <span className="flex items-center gap-1 text-[10px] text-white/60">
              <Loader2 className="h-2.5 w-2.5 animate-spin" />
              Indexing…
            </span>
          ) : (
            <p className="font-bold text-sm text-white leading-tight truncate">
              {collection.name ?? "Unnamed Collection"}
            </p>
          )}

          {/* Stats row */}
          <div className="flex items-center gap-2 flex-wrap">
            {collection.totalSupply != null && (
              <span className="text-[10px] font-medium text-white/70">
                {collection.totalSupply.toLocaleString()} items
              </span>
            )}
            {collection.floorPrice && (
              <span className="text-[10px] font-bold text-white/90 flex items-center gap-1">
                Floor {formatDisplayPrice(collection.floorPrice)}
                <HelpIcon content="Lowest active listing" side="top" className="text-white/50" />
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

function CollectionCoverSkeleton() {
  return (
    <div className="rounded-2xl overflow-hidden border border-border/40">
      <div className="relative aspect-[3/4] w-full">
        <Skeleton className="absolute inset-0 rounded-none" />
      </div>
    </div>
  );
}

interface CreatorCollectionGridProps {
  collections: ApiCollection[];
  isLoading: boolean;
}

export function CreatorCollectionGrid({ collections, isLoading }: CreatorCollectionGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <CollectionCoverSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (collections.length === 0) return null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {collections.map((col) => (
        <CollectionCover key={col.contractAddress} collection={col} />
      ))}
    </div>
  );
}
