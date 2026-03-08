"use client";

import { useState } from "react";
import Link from "next/link";
import { useCollections } from "@/hooks/use-collections";
import { useOrders } from "@/hooks/use-orders";
import { useActivities } from "@/hooks/use-activities";
import { CollectionCard, CollectionCardSkeleton } from "@/components/shared/collection-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ipfsToHttp, timeAgo } from "@/lib/utils";
import {
  Compass,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Layers,
  Activity,
  Tag,
  Handshake,
  ArrowRightLeft,
  Image as ImageIcon,
} from "lucide-react";
import type { ApiActivity, ApiOrder } from "@medialane/sdk";
import { usePlatformStats } from "@/hooks/use-stats";
import Image from "next/image";

// ─── Hero ─────────────────────────────────────────────────────────────────────

function Hero() {
  const { stats } = usePlatformStats();

  const statItems = [
    { label: "Collections", value: stats?.collections },
    { label: "Assets", value: stats?.tokens },
    { label: "Sales", value: stats?.sales },
  ];

  return (
    <section className="relative overflow-hidden border-b border-border/60">
      {/* Ambient glows */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-primary/8 blur-3xl animate-blob" />
        <div className="absolute -top-20 right-0 h-80 w-80 rounded-full bg-purple-500/8 blur-3xl animate-blob-slow" />
        <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-blue-500/5 blur-3xl" />
      </div>

      <div className="container mx-auto px-4 py-16 sm:py-24 relative">
        <div className="max-w-2xl space-y-7">
          {/* Pill badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/8 px-3.5 py-1 text-[11px] font-bold tracking-wide text-primary uppercase">
            <Sparkles className="h-3 w-3" />
            IP marketplace on Starknet
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-[1.05] tracking-tight">
            Create, license &{" "}
            <span className="gradient-text">trade IP assets</span>
            {" "}— gasless for everyone.
          </h1>

          {/* Subhead */}
          <p className="text-muted-foreground text-lg max-w-xl leading-relaxed">
            A decentralised marketplace for intellectual property NFTs built on Starknet.
            Register your creative works on-chain in under a minute.
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <Button size="lg" asChild className="gap-2 shadow-lg shadow-primary/20">
              <Link href="/marketplace">
                <Compass className="h-4 w-4" />
                Explore marketplace
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="gap-2">
              <Link href="/create">
                <Sparkles className="h-4 w-4" />
                Create IP asset
              </Link>
            </Button>
          </div>

          {/* Stats pills */}
          {stats && (
            <div className="flex flex-wrap items-center gap-3 pt-1">
              {statItems.map(({ label, value }) => (
                <div
                  key={label}
                  className="flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1.5 text-sm"
                >
                  <span className="font-bold text-foreground">
                    {value !== undefined ? value.toLocaleString() : "—"}
                  </span>
                  <span className="text-muted-foreground">{label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

// ─── Featured Collections ─────────────────────────────────────────────────────

function FeaturedCollections() {
  const { collections: featured, isLoading: featuredLoading } = useCollections(1, 6, true);
  const { collections: all, isLoading: allLoading } = useCollections(1, 6);
  const isLoading = featuredLoading || (featured.length === 0 && allLoading);
  const collections = featured.length > 0 ? featured : all;

  return (
    <section className="container mx-auto px-4 space-y-5">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <p className="section-label">Curated</p>
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-primary" />
            <h2 className="text-xl font-bold">Collections</h2>
          </div>
        </div>
        <Button variant="ghost" size="sm" asChild className="gap-1 text-muted-foreground hover:text-foreground">
          <Link href="/collections">
            View all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => <CollectionCardSkeleton key={i} />)
          : collections.map((col) => (
              <CollectionCard key={col.contractAddress} collection={col} />
            ))}
      </div>
    </section>
  );
}

// ─── Recent Listings ──────────────────────────────────────────────────────────

function RecentListingRow({ order }: { order: ApiOrder }) {
  const [imgError, setImgError] = useState(false);
  const name = order.token?.name ?? `Token #${order.nftTokenId}`;
  const image = order.token?.image ? ipfsToHttp(order.token.image) : null;

  return (
    <Link
      href={`/asset/${order.nftContract}/${order.nftTokenId}`}
      className="flex items-center gap-3 px-4 py-3 hover:bg-muted/40 rounded-xl transition-colors group"
    >
      {/* Thumbnail */}
      <div className="h-10 w-10 rounded-lg bg-muted overflow-hidden shrink-0 relative border border-border/60">
        {image && !imgError ? (
          <Image
            src={image}
            alt={name}
            fill
            className="object-cover"
            onError={() => setImgError(true)}
            unoptimized
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/10 to-purple-500/10">
            <ImageIcon className="h-3.5 w-3.5 text-muted-foreground/50" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
          {name}
        </p>
        <p className="text-[11px] text-muted-foreground font-mono truncate">
          {order.nftContract?.slice(0, 14)}…
        </p>
      </div>

      {/* Price + time */}
      <div className="text-right shrink-0">
        <p className="price-value text-sm">{order.price.formatted ?? "—"}</p>
        <p className="text-[10px] text-muted-foreground">{timeAgo(order.createdAt)}</p>
      </div>
    </Link>
  );
}

function RecentListings() {
  const { orders, isLoading } = useOrders({ status: "ACTIVE", sort: "recent", limit: 8 });

  return (
    <section className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <p className="section-label">Fresh on market</p>
          <div className="flex items-center gap-2">
            <Tag className="h-4 w-4 text-primary" />
            <h2 className="text-xl font-bold">Recent Listings</h2>
          </div>
        </div>
        <Button variant="ghost" size="sm" asChild className="gap-1 text-muted-foreground hover:text-foreground">
          <Link href="/marketplace">
            View all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>

      <div className="rounded-2xl border border-border bg-card divide-y divide-border/60 overflow-hidden">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3">
              <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3.5 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
              <Skeleton className="h-3.5 w-16" />
            </div>
          ))
        ) : orders.length === 0 ? (
          <div className="py-10 text-center text-sm text-muted-foreground">No active listings yet.</div>
        ) : (
          orders.map((o) => <RecentListingRow key={o.orderHash} order={o} />)
        )}
      </div>
    </section>
  );
}

// ─── Activity Feed ────────────────────────────────────────────────────────────

const ACTIVITY_ICON: Record<string, React.ElementType> = {
  listing:   Tag,
  sale:      Handshake,
  offer:     TrendingUp,
  transfer:  ArrowRightLeft,
  cancelled: ArrowRightLeft,
};

const ACTIVITY_LABEL: Record<string, string> = {
  listing:   "Listed",
  sale:      "Sold",
  offer:     "Offer",
  transfer:  "Transfer",
  cancelled: "Cancelled",
};

const ACTIVITY_COLOR: Record<string, string> = {
  listing:   "text-primary",
  sale:      "text-emerald-500",
  offer:     "text-amber-500",
  transfer:  "text-blue-400",
  cancelled: "text-muted-foreground",
};

function ActivityRow({ event }: { event: ApiActivity }) {
  const Icon = ACTIVITY_ICON[event.type] ?? ArrowRightLeft;
  const color = ACTIVITY_COLOR[event.type] ?? "text-muted-foreground";
  const contract = event.nftContract ?? event.contractAddress;
  const tokenId  = event.nftTokenId  ?? event.tokenId;

  return (
    <Link
      href={contract && tokenId ? `/asset/${contract}/${tokenId}` : "/activities"}
      className="flex items-center gap-3 px-4 py-3 hover:bg-muted/40 rounded-xl transition-colors group"
    >
      <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0 border border-border/60">
        <Icon className={`h-3.5 w-3.5 ${color}`} />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
          {ACTIVITY_LABEL[event.type]} · Token #{tokenId ?? "—"}
        </p>
        <p className="text-[11px] text-muted-foreground truncate font-mono">
          {contract?.slice(0, 14)}…
        </p>
      </div>

      <div className="text-right shrink-0">
        {event.price?.formatted && (
          <p className="price-value text-sm">{event.price.formatted}</p>
        )}
        <p className="text-[10px] text-muted-foreground">{timeAgo(event.timestamp)}</p>
      </div>
    </Link>
  );
}

function RecentActivity() {
  const { activities, isLoading } = useActivities({ limit: 8 });

  return (
    <section className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <p className="section-label">On-chain</p>
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            <h2 className="text-xl font-bold">Recent Activity</h2>
          </div>
        </div>
        <Button variant="ghost" size="sm" asChild className="gap-1 text-muted-foreground hover:text-foreground">
          <Link href="/activities">
            View all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>

      <div className="rounded-2xl border border-border bg-card divide-y divide-border/60 overflow-hidden">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3">
              <Skeleton className="h-8 w-8 rounded-lg shrink-0" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3.5 w-40" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-3 w-12" />
            </div>
          ))
        ) : activities.length === 0 ? (
          <div className="py-10 text-center text-sm text-muted-foreground">No activity yet.</div>
        ) : (
          activities.map((a, i) => <ActivityRow key={i} event={a} />)
        )}
      </div>
    </section>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function DiscoverPage() {
  return (
    <div className="space-y-12 pb-16">
      <Hero />

      <FeaturedCollections />

      <div className="container mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 gap-10">
        <RecentListings />
        <RecentActivity />
      </div>
    </div>
  );
}
