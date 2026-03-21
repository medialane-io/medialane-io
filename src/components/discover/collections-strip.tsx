"use client";

import { useState } from "react";
import Link from "next/link";
import { useCollections } from "@/hooks/use-collections";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { FadeIn } from "@/components/ui/motion-primitives";
import { BRAND } from "@/lib/brand";
import { ipfsToHttp, formatDisplayPrice } from "@/lib/utils";
import { Layers, ArrowRight, CheckCircle2 } from "lucide-react";
import type { ApiCollection } from "@medialane/sdk";

function CollectionChip({ collection }: { collection: ApiCollection }) {
  const [imgError, setImgError] = useState(false);
  const image = collection.image && !imgError ? ipfsToHttp(collection.image) : null;
  const initial = (collection.name ?? "?").charAt(0).toUpperCase();

  return (
    <Link
      href={`/collections/${collection.contractAddress}`}
      className="block shrink-0 w-44 sm:w-52 snap-start active:scale-[0.97] transition-transform duration-150"
    >
      <div className="bento-cell overflow-hidden group">
        {/* Square image */}
        <div className="aspect-square bg-muted relative overflow-hidden">
          {image ? (
            <img
              src={image}
              alt={collection.name ?? ""}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-brand-purple/30 via-brand-blue/20 to-brand-navy/40 flex items-center justify-center">
              <span className="text-5xl font-black text-white/10 select-none">{initial}</span>
            </div>
          )}
        </div>
        {/* Info */}
        <div className="p-3 space-y-0.5">
          <div className="flex items-center gap-1 min-w-0">
            <p className="text-sm font-semibold truncate leading-snug">
              {collection.name ?? "Unnamed"}
            </p>
            {collection.isKnown && (
              <CheckCircle2 className="h-3 w-3 text-blue-400 shrink-0" />
            )}
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{collection.totalSupply ?? 0} items</span>
            {collection.floorPrice && (
              <span className="font-semibold text-brand-orange">
                {formatDisplayPrice(collection.floorPrice)}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

function CollectionChipSkeleton() {
  return (
    <div className="shrink-0 w-44 sm:w-52">
      <Skeleton className="aspect-square w-full rounded-t-xl rounded-b-none" />
      <div className="p-3 space-y-1.5 bento-cell rounded-t-none border-t-0">
        <Skeleton className="h-3.5 w-28" />
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
  );
}

export function CollectionsStrip() {
  const { collections, isLoading } = useCollections(1, 8);

  return (
    <FadeIn>
      <section className="space-y-4">
        <div className="px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div>
            <p className="section-label">Trending</p>
            <div className="flex items-center gap-2 mt-0.5">
              <Layers className={`h-4 w-4 ${BRAND.blue.text}`} />
              <h2 className="text-xl font-bold">Collections</h2>
            </div>
          </div>
          <Button variant="ghost" size="sm" asChild className="gap-1 text-muted-foreground text-sm">
            <Link href="/collections">
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>

        {/* Horizontal scroll — bleeds to edge on mobile */}
        <div className="overflow-x-auto scrollbar-hide snap-x snap-mandatory -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8">
          <div className="flex gap-3 w-max pb-1">
            {isLoading
              ? Array.from({ length: 6 }).map((_, i) => <CollectionChipSkeleton key={i} />)
              : collections.map((col) => (
                  <CollectionChip key={col.contractAddress} collection={col} />
                ))}
          </div>
        </div>
      </section>
    </FadeIn>
  );
}
