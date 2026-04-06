"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { LayoutGrid, ChevronRight, CheckCircle2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { MotionCard } from "@/components/ui/motion-primitives";
import { TokenCard, TokenCardSkeleton } from "@/components/shared/token-card";
import { HelpIcon } from "@/components/ui/help-icon";
import { useCollectionTokens } from "@/hooks/use-collections";
import { ipfsToHttp, formatDisplayPrice } from "@/lib/utils";
import type { ApiCollection } from "@medialane/sdk";

// Square collection cover card — matches TokenCard's aspect-square + overlay style
function CollectionCoverCard({ collection }: { collection: ApiCollection }) {
  const [imgError, setImgError] = useState(false);
  const imageUrl = collection.image ? ipfsToHttp(collection.image) : null;
  const showImage = imageUrl && !imgError;
  const initial = (collection.name ?? "C").charAt(0).toUpperCase();

  return (
    <MotionCard className="card-base group">
      <Link href={`/collections/${collection.contractAddress}`} className="block relative">
        <div className="relative aspect-square w-full overflow-hidden bg-muted">
          {showImage ? (
            <Image
              src={imageUrl}
              alt={collection.name ?? "Collection"}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
              onError={() => setImgError(true)}
              unoptimized
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-brand-purple/30 via-brand-blue/20 to-brand-navy/40 flex items-center justify-center">
              <span className="text-6xl font-black text-white/10 select-none">{initial}</span>
            </div>
          )}

          {/* Bottom overlay: name + stats */}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent pt-10 pb-3 px-3">
            <p className="text-[13px] font-bold text-white truncate leading-snug drop-shadow-sm flex items-center gap-1">
              {collection.name ?? "Unnamed"}
              {collection.isKnown && (
                <>
                  <CheckCircle2 className="inline h-3 w-3 text-blue-400 shrink-0" />
                  <HelpIcon content="Verified collection" side="top" className="shrink-0" />
                </>
              )}
            </p>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {collection.totalSupply != null && (
                <span className="text-[10px] text-white/70">
                  {collection.totalSupply.toLocaleString()} items
                </span>
              )}
              {collection.floorPrice && (
                <span className="text-[10px] font-semibold text-white/90">
                  Floor {formatDisplayPrice(collection.floorPrice)}
                </span>
              )}
            </div>
          </div>

          {/* "Collection" label — top right */}
          <div className="absolute top-2 right-2 bg-black/55 backdrop-blur-sm rounded-full px-2 py-0.5 border border-white/10">
            <span className="text-[10px] font-bold text-white/80 uppercase tracking-wide">Collection</span>
          </div>
        </div>
      </Link>
    </MotionCard>
  );
}

// Square "View all" end card — matches TokenCard height
function ViewAllCard({ href }: { href: string }) {
  return (
    <Link href={href} className="snap-start shrink-0 w-52 block">
      <MotionCard className="card-base border-dashed">
        <div className="aspect-square flex flex-col items-center justify-center gap-3 p-4">
          <div className="h-10 w-10 rounded-full border border-dashed border-border/60 flex items-center justify-center">
            <LayoutGrid className="h-4 w-4 text-muted-foreground/60" />
          </div>
          <div className="text-center space-y-0.5">
            <p className="text-xs font-semibold">View all</p>
            <p className="text-[10px] text-muted-foreground">in collection</p>
          </div>
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/60" />
        </div>
      </MotionCard>
    </Link>
  );
}

export function CollectionCarouselRow({
  collection,
}: {
  collection: ApiCollection;
  dynamicPrimary?: string;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollStartLeft = useRef(0);

  const { tokens, isLoading } = useCollectionTokens(collection.contractAddress, 1, 10);

  function onMouseDown(e: React.MouseEvent) {
    isDragging.current = true;
    startX.current = e.pageX - (scrollRef.current?.offsetLeft ?? 0);
    scrollStartLeft.current = scrollRef.current?.scrollLeft ?? 0;
  }

  function onMouseMove(e: React.MouseEvent) {
    if (!isDragging.current || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    scrollRef.current.scrollLeft = scrollStartLeft.current - (x - startX.current);
  }

  function onMouseUp() {
    isDragging.current = false;
  }

  return (
    <div className="space-y-3">
      {/* Row header */}
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold truncate max-w-[70%]">
          {collection.name ?? "Unnamed Collection"}
        </h3>
        <Link
          href={`/collections/${collection.contractAddress}`}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-0.5"
        >
          See all <ChevronRight className="h-3 w-3" />
        </Link>
      </div>

      {/* Scroll strip — all cards are w-52 with aspect-square so heights are uniform */}
      <div
        ref={scrollRef}
        className="flex items-start gap-3 overflow-x-auto scrollbar-none snap-x snap-mandatory cursor-grab active:cursor-grabbing pb-1"
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
      >
        {/* Collection cover — square, same size as token cards */}
        <div className="snap-start shrink-0 w-52">
          <CollectionCoverCard collection={collection} />
        </div>

        {/* Token cards */}
        {isLoading
          ? Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="snap-start shrink-0 w-52">
                <TokenCardSkeleton />
              </div>
            ))
          : tokens.map((token) => (
              <div key={`${token.contractAddress}-${token.tokenId}`} className="snap-start shrink-0 w-52">
                <TokenCard token={token} showBuyButton={false} />
              </div>
            ))}

        {/* View all CTA */}
        {!isLoading && (
          <ViewAllCard href={`/collections/${collection.contractAddress}`} />
        )}
      </div>
    </div>
  );
}
