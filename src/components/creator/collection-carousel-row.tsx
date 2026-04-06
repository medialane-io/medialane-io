"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { LayoutGrid, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useCollectionTokens } from "@/hooks/use-collections";
import { ipfsToHttp } from "@/lib/utils";
import type { ApiCollection, ApiToken } from "@medialane/sdk";

function TokenMiniCard({ token }: { token: ApiToken }) {
  const [imgError, setImgError] = useState(false);
  const imageUrl = token.metadata?.image ? ipfsToHttp(token.metadata.image) : null;
  const showImage = imageUrl && !imgError;
  const initial = (token.metadata?.name ?? `#${token.tokenId}`).charAt(0).toUpperCase();

  return (
    <Link
      href={`/asset/${token.contractAddress}/${token.tokenId}`}
      className="snap-start shrink-0 w-48 block"
    >
      <div className="bento-cell overflow-hidden hover:border-primary/40 transition-colors">
        <div className="relative aspect-square w-full overflow-hidden bg-muted">
          {showImage ? (
            <Image
              src={imageUrl}
              alt={token.metadata?.name ?? `Token #${token.tokenId}`}
              fill
              className="object-cover"
              onError={() => setImgError(true)}
              unoptimized
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-muted-foreground/10 to-muted-foreground/20 flex items-center justify-center">
              <span className="text-3xl font-black text-white/10 select-none">{initial}</span>
            </div>
          )}
        </div>
        <div className="p-2">
          <p className="text-xs font-medium truncate leading-tight">
            {token.metadata?.name ?? `#${token.tokenId}`}
          </p>
        </div>
      </div>
    </Link>
  );
}

function CollectionCoverCard({
  collection,
  dynamicPrimary,
}: {
  collection: ApiCollection;
  dynamicPrimary: string;
}) {
  const [imgError, setImgError] = useState(false);
  const imageUrl = collection.image ? ipfsToHttp(collection.image) : null;
  const showImage = imageUrl && !imgError;
  const initial = (collection.name ?? "C").charAt(0).toUpperCase();

  return (
    <Link
      href={`/collections/${collection.contractAddress}`}
      className="snap-start shrink-0 w-56 block"
    >
      <div
        className="rounded-xl overflow-hidden border border-border/60 hover:border-primary/50 transition-colors h-full"
        style={{ background: `linear-gradient(135deg, ${dynamicPrimary}22 0%, transparent 60%)` }}
      >
        <div className="relative aspect-square w-full overflow-hidden bg-muted">
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
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${dynamicPrimary}55, ${dynamicPrimary}22)`,
              }}
            >
              <span className="text-5xl font-black text-white/20 select-none">{initial}</span>
            </div>
          )}
        </div>
        <div className="p-3 space-y-0.5">
          <p className="text-sm font-bold truncate leading-tight">
            {collection.name ?? "Unnamed Collection"}
          </p>
          {collection.symbol && (
            <p className="text-xs text-muted-foreground">{collection.symbol}</p>
          )}
        </div>
      </div>
    </Link>
  );
}

function ViewAllCard({ href }: { href: string }) {
  return (
    <Link href={href} className="snap-start shrink-0 w-48 block h-full">
      <div className="bento-cell border-dashed h-full flex flex-col items-center justify-center gap-2 p-4 hover:border-primary/40 transition-colors min-h-[160px]">
        <div className="h-9 w-9 rounded-full border border-dashed border-border flex items-center justify-center">
          <LayoutGrid className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="text-center space-y-0.5">
          <p className="text-xs font-semibold">View all</p>
          <p className="text-[10px] text-muted-foreground">in collection</p>
        </div>
        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
      </div>
    </Link>
  );
}

export function CollectionCarouselRow({
  collection,
  dynamicPrimary,
}: {
  collection: ApiCollection;
  dynamicPrimary: string;
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
    const walk = x - startX.current;
    scrollRef.current.scrollLeft = scrollStartLeft.current - walk;
  }

  function onMouseUp() {
    isDragging.current = false;
  }

  return (
    <div className="space-y-2">
      {/* Row label */}
      <div className="flex items-center justify-between px-0.5">
        <p className="text-sm font-semibold truncate max-w-[70%]">
          {collection.name ?? "Unnamed Collection"}
        </p>
        <Link
          href={`/collections/${collection.contractAddress}`}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-0.5"
        >
          See all <ChevronRight className="h-3 w-3" />
        </Link>
      </div>

      {/* Horizontal scroll strip */}
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto scrollbar-none snap-x snap-mandatory cursor-grab active:cursor-grabbing pb-1"
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
      >
        {/* Collection cover card */}
        <CollectionCoverCard collection={collection} dynamicPrimary={dynamicPrimary} />

        {/* Token mini cards */}
        {isLoading
          ? Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="snap-start shrink-0 w-48">
                <div className="bento-cell overflow-hidden">
                  <Skeleton className="aspect-square w-full" />
                  <div className="p-2">
                    <Skeleton className="h-3 w-3/4" />
                  </div>
                </div>
              </div>
            ))
          : tokens.map((token) => (
              <TokenMiniCard key={`${token.contractAddress}-${token.tokenId}`} token={token} />
            ))}

        {/* View all CTA */}
        {!isLoading && (
          <ViewAllCard href={`/collections/${collection.contractAddress}`} />
        )}
      </div>
    </div>
  );
}
