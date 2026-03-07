"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
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
} from "lucide-react";
import type { ApiActivity, ApiOrder } from "@medialane/sdk";
import { usePlatformStats } from "@/hooks/use-stats";

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
      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -top-16 right-0 h-72 w-72 rounded-full bg-purple-500/10 blur-3xl" />
      </div>

      <div className="container mx-auto px-4 py-16 sm:py-24 relative">
        <div className="max-w-2xl space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary">
            <Sparkles className="h-3 w-3" />
            IP marketplace on Starknet
          </div>

          <h1 className="text-4xl sm:text-5xl font-black leading-tight tracking-tight">
            Create, license &{" "}
            <span className="bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
              trade IP assets
            </span>{" "}
            — gasless for everyone.
          </h1>

          <p className="text-muted-foreground text-lg max-w-xl leading-relaxed">
            Medialane is a decentralised marketplace for intellectual property NFTs built on
            Starknet. Register your creative works on-chain in under a minute.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button size="lg" asChild className="gap-2">
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

          {stats && (
            <div className="flex items-center gap-6 pt-2">
              {statItems.map(({ label, value }) => (
                <div key={label} className="text-sm">
                  <span className="font-bold text-foreground text-base">
                    {value !== undefined ? value.toLocaleString() : "—"}
                  </span>
                  <span className="text-muted-foreground ml-1.5">{label}</span>
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
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-primary" />
          <h2 className="text-xl font-bold">Collections</h2>
        </div>
        <Button variant="ghost" size="sm" asChild className="gap-1 text-muted-foreground">
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

  return (
    <Link
      href={`/asset/${order.nftContract}/${order.nftTokenId}`}
      className="flex items-center gap-3 px-4 py-3 hover:bg-muted/40 rounded-xl transition-colors group"
    >
      {/* Thumbnail */}
      <div className="h-10 w-10 rounded-lg bg-muted overflow-hidden shrink-0 relative">
        <span className="absolute inset-0 flex items-center justify-center text-xs font-mono text-muted-foreground">
          #{order.nftTokenId}
        </span>
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
          Token #{order.nftTokenId}
        </p>
        <p className="text-xs text-muted-foreground font-mono truncate">
          {order.nftContract?.slice(0, 14)}…
        </p>
      </div>

      {/* Price + time */}
      <div className="text-right shrink-0">
        <p className="text-sm font-semibold">{order.price.formatted ?? "—"}</p>
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
        <div className="flex items-center gap-2">
          <Tag className="h-4 w-4 text-primary" />
          <h2 className="text-xl font-bold">Recent Listings</h2>
        </div>
        <Button variant="ghost" size="sm" asChild className="gap-1 text-muted-foreground">
          <Link href="/marketplace">
            View all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>

      <div className="rounded-xl border border-border bg-card divide-y divide-border/60 overflow-hidden">
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

function ActivityRow({ event }: { event: ApiActivity }) {
  const Icon = ACTIVITY_ICON[event.type] ?? ArrowRightLeft;
  const contract = event.nftContract ?? event.contractAddress;
  const tokenId  = event.nftTokenId  ?? event.tokenId;

  return (
    <Link
      href={contract && tokenId ? `/asset/${contract}/${tokenId}` : "/activities"}
      className="flex items-center gap-3 px-4 py-3 hover:bg-muted/40 rounded-xl transition-colors group"
    >
      <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
          {ACTIVITY_LABEL[event.type]} · Token #{tokenId ?? "—"}
        </p>
        <p className="text-xs text-muted-foreground truncate font-mono">
          {contract?.slice(0, 14)}…
        </p>
      </div>

      <div className="text-right shrink-0">
        {event.price?.formatted && (
          <p className="text-sm font-semibold">{event.price.formatted}</p>
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
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" />
          <h2 className="text-xl font-bold">Recent Activity</h2>
        </div>
        <Button variant="ghost" size="sm" asChild className="gap-1 text-muted-foreground">
          <Link href="/activities">
            View all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>

      <div className="rounded-xl border border-border bg-card divide-y divide-border/60 overflow-hidden">
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
