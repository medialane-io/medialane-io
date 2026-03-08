"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { motion } from "framer-motion";
import { useCollections } from "@/hooks/use-collections";
import { useOrders } from "@/hooks/use-orders";
import { useActivities } from "@/hooks/use-activities";
import { usePlatformStats } from "@/hooks/use-stats";
import { CollectionCard, CollectionCardSkeleton } from "@/components/shared/collection-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { HeroAurora } from "@/components/ui/aurora";
import { FadeIn, Stagger, StaggerItem, KineticWords } from "@/components/ui/motion-primitives";
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
  Zap,
  PlusCircle,
} from "lucide-react";
import type { ApiActivity, ApiOrder } from "@medialane/sdk";

const EASE_OUT = [0.25, 0.46, 0.45, 0.94] as const;

// ─── Hero ─────────────────────────────────────────────────────────────────────

function Hero() {
  const { stats } = usePlatformStats();

  return (
    <section className="relative overflow-hidden border-b border-border/50 bg-background">
      <HeroAurora />

      <div className="relative px-4 py-16 sm:py-24 max-w-3xl mx-auto text-center sm:text-left">
        {/* Badge */}
        <motion.div
          className="flex justify-center sm:justify-start mb-6"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE_OUT }}
        >
          <span className="pill-badge">
            <Zap className="h-3 w-3" />
            IP marketplace on Starknet
          </span>
        </motion.div>

        {/* Kinetic headline */}
        <div
          className="text-4xl sm:text-5xl lg:text-6xl font-black leading-[1.05] mb-6"
          style={{ perspective: "800px" }}
        >
          <KineticWords text="Create, license &" />
          <br />
          <span className="gradient-text">
            <KineticWords text="trade IP assets" />
          </span>
          <br />
          <KineticWords text="— gasless for everyone." />
        </div>

        {/* Sub */}
        <motion.p
          className="text-muted-foreground text-base sm:text-lg max-w-xl mx-auto sm:mx-0 leading-relaxed mb-8"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35, ease: EASE_OUT }}
        >
          A decentralised marketplace for intellectual property NFTs built on Starknet.
          Register your creative works on-chain in under a minute.
        </motion.p>

        {/* CTAs */}
        <motion.div
          className="flex flex-col sm:flex-row gap-3 justify-center sm:justify-start"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.45, ease: EASE_OUT }}
        >
          <Button size="lg" asChild className="gap-2 bg-brand-purple text-white shadow-lg">
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
        </motion.div>

        {/* Stats pills */}
        {stats && (
          <motion.div
            className="flex flex-wrap gap-2 justify-center sm:justify-start mt-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.55, ease: EASE_OUT }}
          >
            {[
              { label: "Collections", value: stats.collections },
              { label: "Assets", value: stats.tokens },
              { label: "Sales", value: stats.sales },
            ].map(({ label, value }) => (
              <div
                key={label}
                className="flex items-center gap-1.5 rounded-full border border-border bg-card/80 px-3.5 py-1.5 text-sm backdrop-blur-sm"
              >
                <span className="font-bold">{value?.toLocaleString() ?? "—"}</span>
                <span className="text-muted-foreground">{label}</span>
              </div>
            ))}
          </motion.div>
        )}
      </div>
    </section>
  );
}

// ─── Bento grid — collections + quick actions ─────────────────────────────────

function BentoSection() {
  const { collections: featured, isLoading: fl } = useCollections(1, 3, true);
  const { collections: all, isLoading: al } = useCollections(1, 3);
  const isLoading = fl || (featured.length === 0 && al);
  const cols = featured.length > 0 ? featured : all;

  const QUICK = [
    {
      title: "Mint IP Asset",
      sub: "Register any creative work on-chain",
      href: "/create/asset",
      icon: Sparkles,
      from: "from-brand-purple/20",
      to: "to-brand-blue/20",
      iconColor: "text-brand-purple",
    },
    {
      title: "Create Collection",
      sub: "Deploy your own NFT collection",
      href: "/create/collection",
      icon: Layers,
      from: "from-brand-blue/20",
      to: "to-brand-rose/20",
      iconColor: "text-brand-blue",
    },
    {
      title: "Browse Market",
      sub: "Discover & buy IP assets",
      href: "/marketplace",
      icon: Compass,
      from: "from-brand-rose/20",
      to: "to-brand-orange/20",
      iconColor: "text-brand-rose",
    },
    {
      title: "Launchpad",
      sub: "Featured creator drops",
      href: "/launchpad",
      icon: Zap,
      from: "from-brand-orange/20",
      to: "to-brand-purple/20",
      iconColor: "text-brand-orange",
    },
  ];

  return (
    <section className="px-4 space-y-4">
      <FadeIn>
        <div className="flex items-center justify-between mb-1">
          <div>
            <p className="section-label">Curated drops</p>
            <div className="flex items-center gap-2 mt-0.5">
              <Layers className="h-4 w-4 text-brand-purple" />
              <h2 className="text-xl font-bold">Collections</h2>
            </div>
          </div>
          <Button variant="ghost" size="sm" asChild className="gap-1 text-muted-foreground text-sm">
            <Link href="/collections">
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </FadeIn>

      {/* Bento grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 auto-rows-min">

        {/* Featured collection — large left cell, spans 2x2 on md+ */}
        {isLoading ? (
          <div className="col-span-2 row-span-2 bento-cell">
            <Skeleton className="aspect-[4/3] w-full" />
            <div className="p-4 space-y-2">
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          </div>
        ) : cols[0] ? (
          <FadeIn className="col-span-2 row-span-2">
            <FeaturedCollectionCell collection={cols[0]} large />
          </FadeIn>
        ) : null}

        {/* Quick action cells — 2 cells on right side */}
        {QUICK.slice(0, 2).map((q, i) => (
          <FadeIn key={q.href} delay={0.1 + i * 0.08} className="col-span-1">
            <QuickActionCell {...q} />
          </FadeIn>
        ))}

        {/* Second featured collection */}
        {isLoading ? (
          <div className="col-span-2 bento-cell">
            <Skeleton className="aspect-[16/7] w-full" />
            <div className="p-3 space-y-1.5">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-3 w-1/4" />
            </div>
          </div>
        ) : cols[1] ? (
          <FadeIn className="col-span-2" delay={0.15}>
            <FeaturedCollectionCell collection={cols[1]} />
          </FadeIn>
        ) : null}

        {/* More quick actions */}
        {QUICK.slice(2).map((q, i) => (
          <FadeIn key={q.href} delay={0.2 + i * 0.08} className="col-span-1">
            <QuickActionCell {...q} />
          </FadeIn>
        ))}
      </div>

      {/* Third collection — full row */}
      {!isLoading && cols[2] && (
        <FadeIn delay={0.25}>
          <CollectionCard collection={cols[2]} />
        </FadeIn>
      )}
    </section>
  );
}

function FeaturedCollectionCell({
  collection,
  large = false,
}: {
  collection: import("@medialane/sdk").ApiCollection;
  large?: boolean;
}) {
  const [imgError, setImgError] = useState(false);
  const imageUrl = collection.image ? ipfsToHttp(collection.image) : null;
  const showImage = imageUrl && !imgError;
  const initial = (collection.name ?? "?").charAt(0).toUpperCase();

  return (
    <Link href={`/collections/${collection.contractAddress}`} className="block h-full">
      <div className={`bento-cell h-full ${large ? "min-h-[220px]" : ""} relative overflow-hidden`}>
        {/* Background */}
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
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        {/* Content */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <p className="text-white font-bold text-base truncate leading-snug">
            {collection.name ?? "Unnamed"}
          </p>
          <div className="flex items-center gap-3 mt-1">
            {collection.totalSupply != null && (
              <span className="text-white/70 text-xs">{collection.totalSupply} items</span>
            )}
            {collection.floorPrice && (
              <span className="text-brand-orange text-xs font-bold">Floor {collection.floorPrice}</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

function QuickActionCell({
  title,
  sub,
  href,
  icon: Icon,
  from,
  to,
  iconColor,
}: {
  title: string;
  sub: string;
  href: string;
  icon: React.ElementType;
  from: string;
  to: string;
  iconColor: string;
}) {
  return (
    <Link href={href} className="block h-full">
      <div className={`bento-cell h-full min-h-[100px] p-3 sm:p-4 bg-gradient-to-br ${from} ${to} flex flex-col justify-between`}>
        <div className={`h-8 w-8 rounded-xl bg-background/60 flex items-center justify-center`}>
          <Icon className={`h-4 w-4 ${iconColor}`} />
        </div>
        <div className="mt-3">
          <p className="font-bold text-sm leading-snug">{title}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{sub}</p>
        </div>
      </div>
    </Link>
  );
}

// ─── Recent listings feed ─────────────────────────────────────────────────────

function RecentListingRow({ order }: { order: ApiOrder }) {
  const [imgError, setImgError] = useState(false);
  const name = order.token?.name ?? `Token #${order.nftTokenId}`;
  const image = order.token?.image ? ipfsToHttp(order.token.image) : null;

  return (
    <Link
      href={`/asset/${order.nftContract}/${order.nftTokenId}`}
      className="flex items-center gap-3 px-4 py-3 active:bg-muted/60 rounded-xl transition-colors"
    >
      <div className="h-11 w-11 rounded-xl bg-muted overflow-hidden shrink-0 relative border border-border/60">
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
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-brand-purple/15 to-brand-blue/15">
            <ImageIcon className="h-4 w-4 text-muted-foreground/50" />
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium truncate">{name}</p>
        <p className="text-[11px] text-muted-foreground font-mono truncate">
          {order.nftContract?.slice(0, 14)}…
        </p>
      </div>
      <div className="text-right shrink-0">
        <p className="price-value text-sm">{order.price.formatted ?? "—"}</p>
        <p className="text-[10px] text-muted-foreground">{timeAgo(order.createdAt)}</p>
      </div>
    </Link>
  );
}

// ─── Activity feed ────────────────────────────────────────────────────────────

const ACTIVITY_ICON: Record<string, React.ElementType> = {
  listing: Tag,
  sale: Handshake,
  offer: TrendingUp,
  transfer: ArrowRightLeft,
  cancelled: ArrowRightLeft,
};
const ACTIVITY_LABEL: Record<string, string> = {
  listing: "Listed",
  sale: "Sold",
  offer: "Offer",
  transfer: "Transfer",
  cancelled: "Cancelled",
};
const ACTIVITY_COLOR: Record<string, string> = {
  listing: "text-brand-purple",
  sale: "text-emerald-500",
  offer: "text-brand-orange",
  transfer: "text-brand-blue",
  cancelled: "text-muted-foreground",
};

function ActivityRow({ event }: { event: ApiActivity }) {
  const Icon = ACTIVITY_ICON[event.type] ?? ArrowRightLeft;
  const color = ACTIVITY_COLOR[event.type] ?? "text-muted-foreground";
  const contract = event.nftContract ?? event.contractAddress;
  const tokenId = event.nftTokenId ?? event.tokenId;

  return (
    <Link
      href={contract && tokenId ? `/asset/${contract}/${tokenId}` : "/activities"}
      className="flex items-center gap-3 px-4 py-3 active:bg-muted/60 rounded-xl transition-colors"
    >
      <div className="h-8 w-8 rounded-xl bg-muted flex items-center justify-center shrink-0 border border-border/60">
        <Icon className={`h-3.5 w-3.5 ${color}`} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium truncate">
          {ACTIVITY_LABEL[event.type]} · Token #{tokenId ?? "—"}
        </p>
        <p className="text-[11px] text-muted-foreground font-mono truncate">
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

function FeedSection() {
  const { orders, isLoading: ordersLoading } = useOrders({ status: "ACTIVE", sort: "recent", limit: 6 });
  const { activities, isLoading: activitiesLoading } = useActivities({ limit: 6 });

  return (
    <section className="px-4 grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Recent Listings */}
      <FadeIn>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="section-label">Fresh on market</p>
              <div className="flex items-center gap-2 mt-0.5">
                <Tag className="h-4 w-4 text-brand-rose" />
                <h2 className="text-lg font-bold">Recent Listings</h2>
              </div>
            </div>
            <Button variant="ghost" size="sm" asChild className="gap-1 text-muted-foreground">
              <Link href="/marketplace">
                View all <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
          <div className="bento-cell divide-y divide-border/50">
            {ordersLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3">
                  <Skeleton className="h-11 w-11 rounded-xl shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3.5 w-32" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                  <Skeleton className="h-3.5 w-16" />
                </div>
              ))
            ) : orders.length === 0 ? (
              <div className="py-10 text-center text-sm text-muted-foreground">
                No active listings yet.
              </div>
            ) : (
              orders.map((o) => <RecentListingRow key={o.orderHash} order={o} />)
            )}
          </div>
        </div>
      </FadeIn>

      {/* Recent Activity */}
      <FadeIn delay={0.1}>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="section-label">On-chain</p>
              <div className="flex items-center gap-2 mt-0.5">
                <Activity className="h-4 w-4 text-brand-blue" />
                <h2 className="text-lg font-bold">Recent Activity</h2>
              </div>
            </div>
            <Button variant="ghost" size="sm" asChild className="gap-1 text-muted-foreground">
              <Link href="/activities">
                View all <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
          <div className="bento-cell divide-y divide-border/50">
            {activitiesLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3">
                  <Skeleton className="h-8 w-8 rounded-xl shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3.5 w-40" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-3 w-12" />
                </div>
              ))
            ) : activities.length === 0 ? (
              <div className="py-10 text-center text-sm text-muted-foreground">
                No activity yet.
              </div>
            ) : (
              activities.map((a, i) => <ActivityRow key={i} event={a} />)
            )}
          </div>
        </div>
      </FadeIn>
    </section>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function DiscoverPage() {
  return (
    <div className="space-y-10 pb-16">
      <Hero />
      <BentoSection />
      <FeedSection />
    </div>
  );
}
