"use client";

import { useRef } from "react";
import Link from "next/link";
import { LayoutGrid, ChevronRight } from "lucide-react";
import { MotionCard } from "@/components/ui/motion-primitives";
import { TokenCard, TokenCardSkeleton } from "@/components/shared/token-card";
import { CollectionCard, CollectionCardSkeleton } from "@/components/shared/collection-card";
import { useCollectionTokens } from "@/hooks/use-collections";
import type { ApiCollection } from "@medialane/sdk";

// Square "View all" end card — matches token card width
function ViewAllCard({ href }: { href: string }) {
  return (
    <Link href={href} className="snap-start shrink-0 w-64 block">
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

      {/* Scroll strip — w-64 cards, collection cover uses vertical aspect-[3/4] like frontpage */}
      <div
        ref={scrollRef}
        className="flex items-end gap-3 overflow-x-auto scrollbar-none snap-x snap-mandatory cursor-grab active:cursor-grabbing pb-1"
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
      >
        {/* Collection cover — vertical aspect-[3/4] matching frontpage CollectionCard */}
        <div className="snap-start shrink-0 w-64">
          <CollectionCard collection={collection} />
        </div>

        {/* Token cards */}
        {isLoading
          ? Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="snap-start shrink-0 w-64">
                <TokenCardSkeleton />
              </div>
            ))
          : tokens.map((token) => (
              <div key={`${token.contractAddress}-${token.tokenId}`} className="snap-start shrink-0 w-64">
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
