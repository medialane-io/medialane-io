"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, Layers } from "lucide-react";
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

  return (
    <Link href={`/collections/${collection.contractAddress}`} className="block group">
      <div className="rounded-xl border border-border bg-card overflow-hidden hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5 transition-all duration-200">
        {/* Cover image */}
        <div className="relative aspect-[16/7] w-full bg-gradient-to-br from-primary/20 via-purple-500/15 to-blue-500/10 overflow-hidden">
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
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-6xl font-black text-primary/20 select-none">
                {initial}
              </span>
            </div>
          )}
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-card/80 via-transparent to-transparent" />
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          {/* Name + badges */}
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <p className="font-semibold truncate text-sm leading-tight">
                  {collection.name ?? "Unnamed Collection"}
                </p>
                {collection.isKnown && (
                  <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
                )}
              </div>
              {collection.symbol && (
                <p className="text-[11px] text-muted-foreground mt-0.5">{collection.symbol}</p>
              )}
            </div>
          </div>

          {/* Description */}
          {collection.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
              {collection.description}
            </p>
          )}

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 pt-1">
            {[
              { label: "Items", value: collection.totalSupply?.toLocaleString() ?? "—" },
              { label: "Holders", value: collection.holderCount?.toLocaleString() ?? "—" },
              { label: "Floor", value: collection.floorPrice ?? "—" },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-lg bg-muted/40 p-2 text-center">
                <p className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">
                  {label}
                </p>
                <p className="text-xs font-bold mt-0.5 truncate">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Link>
  );
}

export function CollectionCardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <Skeleton className="aspect-[16/7] w-full" />
      <div className="p-4 space-y-3">
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-3 w-1/3" />
        </div>
        <Skeleton className="h-8 w-full" />
        <div className="grid grid-cols-3 gap-2">
          <Skeleton className="h-10 rounded-lg" />
          <Skeleton className="h-10 rounded-lg" />
          <Skeleton className="h-10 rounded-lg" />
        </div>
      </div>
    </div>
  );
}
