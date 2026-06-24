"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Package, Users, Plus, Zap, Timer, Layers } from "lucide-react";
import { FadeIn, Stagger, StaggerItem } from "@/components/ui/motion-primitives";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ServiceHeader } from "@/components/claim/service-header";
import { ClaimBackButton } from "@/components/claim/claim-back-button";
import { useDropCollections, useOnChainDropState, getDropStatus } from "@/hooks/use-drops";
import { ipfsToHttp } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { ApiCollection } from "@medialane/sdk";

// Inline metadata-attribute shape — kept local because ApiCollection in SDK 0.23
// does not yet expose token metadata attributes on collection objects (planned for 0.24+).
type CollectionWithAttributes = ApiCollection & {
  attributes?: { trait_type?: string; value?: string }[];
};

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

function DropCollectionCard({ collection }: { collection: ApiCollection }) {
  const [imgError, setImgError] = useState(false);
  const imageUrl = collection.image ? ipfsToHttp(collection.image) : null;
  const showImage = imageUrl && !imgError;
  const initial = (collection.name ?? "D").charAt(0).toUpperCase();
  // Real status from chain (conditions + supply); falls back to indexed supply if RPC is down.
  const { state } = useOnChainDropState(collection.contractAddress);
  const minted = state?.totalMinted ?? collection.totalSupply ?? 0;
  const status = getDropStatus(state?.conditions ?? null, minted);

  return (
    <Link href={`/launchpad/drop/${collection.contractAddress}`} className="block">
      <div className="bento-cell overflow-hidden flex flex-col hover:border-orange-500/40 transition-colors">
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
        <div className="p-4 flex flex-col gap-3 flex-1">
          <div className="flex-1 space-y-1">
            <p className="font-bold text-sm leading-tight">{collection.name ?? "Unnamed Drop"}</p>
            {collection.description && (
              <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                {collection.description}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {minted.toLocaleString()} minted
            </span>
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

const DROP_FEATURES = [
  {
    icon: Package,
    title: "Fixed Supply Cap",
    desc: "Creator sets the max — scarcity is guaranteed on-chain.",
  },
  {
    icon: Timer,
    title: "Timed Mint Window",
    desc: "Mint opens and closes at exact on-chain timestamps.",
  },
  {
    icon: Zap,
    title: "Gas-Free Minting",
    desc: "Collectors mint without paying gas fees.",
  },
  {
    icon: Layers,
    title: "Transferable ERC-721",
    desc: "Standard NFTs — trade freely in any marketplace.",
  },
];

export function DropContent() {
  const { collections, isLoading } = useDropCollections();

  // Filter: show only collections without a Private visibility attribute.
  // Inert until backend indexes collection attributes — safe for legacy collections.
  const publicCollections = collections.filter(
    (c) =>
      (c as CollectionWithAttributes).attributes?.find((a) => a.trait_type === "Visibility")?.value !== "Private"
  );

  return (
    <div className="pb-16 space-y-10">

      {/* ── Header ── */}
      <section className="px-4 pt-10 max-w-5xl mx-auto">
        <ClaimBackButton />
        <FadeIn>
          <div className="mt-6">
            <ServiceHeader
              icon={<Package className="h-4 w-4 text-white" />}
              title="Drops"
              subtitle="Timed releases with a fixed supply. Browse live drops to collect, or launch your own."
            />
          </div>
        </FadeIn>
        <FadeIn delay={0.08}>
          <div className="mt-6">
            <Link
              href="/launchpad/drop/create"
              className="inline-flex items-center gap-2 h-10 px-5 rounded-xl text-sm font-semibold text-white bg-brand-purple hover:brightness-110 transition-colors"
            >
              <Plus className="h-4 w-4" />
              New drop
            </Link>
          </div>
        </FadeIn>
      </section>

      {/* Features grid */}
      <section className="px-4 max-w-5xl mx-auto">
        <FadeIn>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {DROP_FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bento-cell p-4 space-y-2">
                <Icon className="h-5 w-5 text-orange-500" />
                <p className="text-sm font-semibold leading-tight">{title}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </FadeIn>
      </section>

      {/* Collections grid */}
      <section className="px-4 space-y-4 max-w-5xl mx-auto">
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
        ) : publicCollections.length === 0 ? (
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
            {publicCollections.map((col) => (
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
