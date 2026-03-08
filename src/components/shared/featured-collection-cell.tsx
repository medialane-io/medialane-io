"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ipfsToHttp, formatDisplayPrice } from "@/lib/utils";
import type { ApiCollection } from "@medialane/sdk";

interface FeaturedCollectionCellProps {
  collection: ApiCollection;
  /** When true, enforces a taller minimum height for the 2×2 hero slot */
  large?: boolean;
}

export function FeaturedCollectionCell({ collection, large = false }: FeaturedCollectionCellProps) {
  const [imgError, setImgError] = useState(false);
  const imageUrl = collection.image ? ipfsToHttp(collection.image) : null;
  const showImage = imageUrl && !imgError;
  const initial = (collection.name ?? "?").charAt(0).toUpperCase();

  return (
    <Link href={`/collections/${collection.contractAddress}`} className="block h-full">
      <div className={`bento-cell h-full ${large ? "min-h-[220px]" : ""} relative overflow-hidden`}>
        {showImage ? (
          <Image
            src={imageUrl}
            alt={collection.name ?? "Collection"}
            fill
            className="object-cover"
            onError={() => setImgError(true)}
            unoptimized
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-brand-purple/30 via-brand-blue/20 to-brand-navy/40 flex items-center justify-center">
            <span className="text-8xl font-black text-white/8 select-none">{initial}</span>
          </div>
        )}

        {/* Scrim so text is readable over any image */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        <div className="absolute bottom-0 left-0 right-0 p-4">
          <p className="text-white font-bold text-base truncate leading-snug">
            {collection.name ?? "Unnamed"}
          </p>
          <div className="flex items-center gap-3 mt-1">
            {collection.totalSupply != null && (
              <span className="text-white/70 text-xs">{collection.totalSupply} items</span>
            )}
            {collection.floorPrice && (
              <span className="text-brand-orange text-xs font-bold">
                Floor {formatDisplayPrice(collection.floorPrice)}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
