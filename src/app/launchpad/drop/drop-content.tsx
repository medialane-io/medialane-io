"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Package, Users, Plus } from "lucide-react";
import { FadeIn, Stagger, StaggerItem } from "@/components/ui/motion-primitives";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useDropCollections, getDropStatus } from "@/hooks/use-drops";
import { ipfsToHttp } from "@/lib/utils";
import { BRAND } from "@/lib/brand";
import { cn } from "@/lib/utils";

function DropStatusBadge({ status }: { status: ReturnType<typeof getDropStatus> }) {
  if (status === "live") {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-green-400 bg-green-500/10 rounded-full px-2 py-0.5">
        <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
        Live
      </span>
    );
  }
  if (status === "upcoming") {
    return (
      <span className={cn("inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-blue-400 bg-blue-500/10 rounded-full px-2 py-0.5")}>
        Upcoming
      </span>
    );
  }
  if (status === "sold_out") {
    return (
      <span className={cn("inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-orange-400 bg-orange-500/10 rounded-full px-2 py-0.5")}>
        Sold out
      </span>
    );
  }
  return (
    <span className={cn("inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground bg-muted rounded-full px-2 py-0.5")}>
      Ended
    </span>
  );
}

function DropCollectionCard({ collection }: { collection: any }) {
  const [imgError, setImgError] = useState(false);
  const imageUrl = collection.image ? ipfsToHttp(collection.image) : null;
  const showImage = imageUrl && !imgError;
  const initial = (collection.name ?? "D").charAt(0).toUpperCase();
  // Without per-card conditions fetch, default to "live" for list view
  const status = getDropStatus(null, collection.totalSupply ?? 0);

  return (
    <Link href={`/launchpad/drop/${collection.contractAddress}`} className="block">
      <div className="bento-cell overflow-hidden flex flex-col hover:border-orange-500/40 transition-colors">
        {/* Cover */}
        <div className="relative aspect-video w-full overflow-hidden bg-muted shrink-0">
          {showImage ? (
            <Image
              src={imageUrl}
              alt={collection.name ?? "Drop Collection"}
              fill
              className="object-cover"
              onError={() => setImgError(true)}
              unoptimized
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/40 via-amber-500/30 to-orange-900/50 flex items-center justify-center">
              <span className="text-7xl font-black text-white/10 select-none">{initial}</span>
            </div>
          )}
          <div className="absolute top-2 right-2 flex items-center gap-1.5">
            <DropStatusBadge status={status} />
            <span className="text-[9px] font-bold uppercase tracking-widest text-white bg-black/50 backdrop-blur-sm rounded-full px-2 py-0.5">
              DROP
            </span>
          </div>
        </div>

        {/* Body */}
        <div className="p-4 flex flex-col gap-3 flex-1">
          <div className="flex-1 space-y-1">
            <p className="font-bold text-sm leading-tight">{collection.name ?? "Unnamed Drop"}</p>
            {collection.description && (
              <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                {collection.description}
              </p>
            )}
          </div>

          {/* Stats */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {collection.totalSupply != null && (
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {collection.totalSupply.toLocaleString()} minted
              </span>
            )}
            {collection.symbol && (
              <span className="flex items-center gap-1">
                <Package className="h-3 w-3" />
                {collection.symbol}
              </span>
            )}
          </div>

          <div className="text-xs text-orange-500 font-medium">View drop →</div>
        </div>
      </div>
    </Link>
  );
}

function DropCollectionCardSkeleton() {
  return (
    <div className="bento-cell overflow-hidden">
      <Skeleton className="aspect-video w-full" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-4/5" />
        <Skeleton className="h-8 w-full mt-2" />
      </div>
    </div>
  );
}

export function DropContent() {
  const { collections, isLoading } = useDropCollections();

  return (
    <div className="pb-16 space-y-10">

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border/50">
        <div className="px-4 py-14 sm:py-20">
          <FadeIn>
            <span className="pill-badge mb-5 inline-flex">
              <Package className="h-3 w-3" />
              Collection Drop
            </span>
          </FadeIn>
          <FadeIn delay={0.08}>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black leading-tight mb-3">
              Limited Edition Drops<br />
              <span className="gradient-text">Scarcity on Starknet</span>
            </h1>
          </FadeIn>
          <FadeIn delay={0.16}>
            <p className="text-muted-foreground text-base max-w-xl leading-relaxed">
              Timed NFT drops with a fixed supply cap. Creators set the mint window and max quantity —
              the community races to collect.
            </p>
          </FadeIn>
          <FadeIn delay={0.24}>
            <div className="flex flex-wrap gap-2 mt-5">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/40 text-sm">
                <Package className={`h-3.5 w-3.5 ${BRAND.orange.text}`} />
                <span className="text-muted-foreground">Fixed supply cap</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/40 text-sm">
                <Users className={`h-3.5 w-3.5 text-amber-500`} />
                <span className="text-muted-foreground">Transferable ERC-721</span>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Collections grid */}
      <section className="px-4 space-y-4">
        <FadeIn>
          <div className="flex items-center justify-between">
            <div>
              <p className="section-label">Active</p>
              <h2 className="text-xl font-bold mt-0.5">Open for minting</h2>
            </div>
            <div className="flex items-center gap-2">
              <Button asChild size="sm" variant="outline">
                <Link href="/launchpad/drop/my-drops">My Drops</Link>
              </Button>
              <Button asChild size="sm" className="bg-orange-600 hover:bg-orange-700 text-white gap-1.5">
                <Link href="/launchpad/drop/create">
                  <Plus className="h-3.5 w-3.5" />
                  Create Drop
                </Link>
              </Button>
            </div>
          </div>
        </FadeIn>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => <DropCollectionCardSkeleton key={i} />)}
          </div>
        ) : collections.length === 0 ? (
          <FadeIn>
            <div className="bento-cell border-dashed p-16 text-center space-y-3">
              <div className="flex justify-center">
                <Package className="h-10 w-10 text-muted-foreground/20" />
              </div>
              <p className="text-sm text-muted-foreground">
                No active drops right now. Check back soon.
              </p>
            </div>
          </FadeIn>
        ) : (
          <Stagger className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {collections.map((col) => (
              <StaggerItem key={col.contractAddress}>
                <DropCollectionCard collection={col} />
              </StaggerItem>
            ))}
          </Stagger>
        )}
      </section>

    </div>
  );
}
