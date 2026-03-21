"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useOrders } from "@/hooks/use-orders";
import { useActivities } from "@/hooks/use-activities";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FadeIn } from "@/components/ui/motion-primitives";
import { BRAND } from "@/lib/brand";
import { ipfsToHttp, timeAgo, formatDisplayPrice } from "@/lib/utils";
import {
  ArrowRight,
  TrendingUp,
  Activity,
  Tag,
  Handshake,
  ArrowRightLeft,
  Image as ImageIcon,
} from "lucide-react";
import type { ApiActivity, ApiOrder } from "@medialane/sdk";

// ─── Listing card ─────────────────────────────────────────────────────────────

function ListingCard({ order }: { order: ApiOrder }) {
  const [imgError, setImgError] = useState(false);
  const name = order.token?.name ?? `#${order.nftTokenId}`;
  const image = order.token?.image && !imgError ? ipfsToHttp(order.token.image) : null;

  return (
    <Link
      href={`/asset/${order.nftContract}/${order.nftTokenId}`}
      className="group block"
    >
      <div className="rounded-xl border border-border overflow-hidden hover:border-border/80 transition-colors">
        <div className="aspect-square bg-muted relative overflow-hidden">
          {image ? (
            <Image
              src={image}
              alt={name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              onError={() => setImgError(true)}
              unoptimized
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-brand-purple/10 to-brand-blue/10">
              <ImageIcon className="h-6 w-6 text-muted-foreground/30" />
            </div>
          )}
        </div>
        <div className="p-2.5 bg-card">
          <p className="text-xs font-semibold truncate">{name}</p>
          {order.price && (
            <p className="text-[11px] font-bold text-brand-orange mt-0.5">
              {formatDisplayPrice(order.price.formatted)} {order.price.currency}
            </p>
          )}
          <p className="text-[10px] text-muted-foreground mt-0.5">{timeAgo(order.createdAt)}</p>
        </div>
      </div>
    </Link>
  );
}

function ListingCardSkeleton() {
  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <Skeleton className="aspect-square w-full rounded-none" />
      <div className="p-2.5 space-y-1.5">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
  );
}

// ─── Activity row ─────────────────────────────────────────────────────────────

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
  listing:   BRAND.purple.text,
  sale:      "text-emerald-500",
  offer:     BRAND.orange.text,
  transfer:  BRAND.blue.text,
  cancelled: "text-muted-foreground",
};

const ACTIVITY_BG: Record<string, string> = {
  listing:   "bg-brand-purple/10",
  sale:      "bg-emerald-500/10",
  offer:     "bg-brand-orange/10",
  transfer:  "bg-brand-blue/10",
  cancelled: "bg-muted",
};

function ActivityRow({ event, isLatest }: { event: ApiActivity; isLatest: boolean }) {
  const Icon = ACTIVITY_ICON[event.type] ?? ArrowRightLeft;
  const color = ACTIVITY_COLOR[event.type] ?? "text-muted-foreground";
  const bg = ACTIVITY_BG[event.type] ?? "bg-muted";
  const contract = event.nftContract ?? event.contractAddress;
  const tokenId = event.nftTokenId ?? event.tokenId;

  return (
    <Link
      href={contract && tokenId ? `/asset/${contract}/${tokenId}` : "/activities"}
      className="flex items-center gap-3 px-3 py-3 hover:bg-muted/40 rounded-lg transition-colors"
    >
      <div className={`relative h-8 w-8 rounded-lg ${bg} flex items-center justify-center shrink-0`}>
        <Icon className={`h-3.5 w-3.5 ${color}`} />
        {isLatest && (
          <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-background animate-pulse" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium truncate">
          {ACTIVITY_LABEL[event.type] ?? event.type} ·{" "}
          {(event as any).token?.name ?? `#${tokenId ?? "—"}`}
        </p>
        <p className="text-[11px] text-muted-foreground font-mono truncate">
          {contract?.slice(0, 14)}…
        </p>
      </div>
      <div className="text-right shrink-0">
        {event.price?.formatted && (
          <p className="text-sm font-semibold text-brand-orange">
            {formatDisplayPrice(event.price.formatted)}
          </p>
        )}
        <p className="text-[10px] text-muted-foreground">{timeAgo(event.timestamp)}</p>
      </div>
    </Link>
  );
}

// ─── Feed section ─────────────────────────────────────────────────────────────

export function FeedSection() {
  const { orders, isLoading: ordersLoading } = useOrders({ status: "ACTIVE", sort: "recent", limit: 6 });
  const { activities, isLoading: activitiesLoading } = useActivities({ limit: 8 });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* New Listings */}
      <FadeIn>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="section-label">Fresh on market</p>
              <div className="flex items-center gap-2 mt-0.5">
                <Tag className={`h-4 w-4 ${BRAND.rose.text}`} />
                <h2 className="text-lg font-bold">New Listings</h2>
              </div>
            </div>
            <Button variant="ghost" size="sm" asChild className="gap-1 text-muted-foreground">
              <Link href="/marketplace">
                View all <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>

          {ordersLoading ? (
            <div className="grid grid-cols-3 gap-3">
              {Array.from({ length: 6 }).map((_, i) => <ListingCardSkeleton key={i} />)}
            </div>
          ) : orders.length === 0 ? (
            <div className="rounded-xl border border-border py-12 text-center text-sm text-muted-foreground">
              No active listings yet.
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {orders.map((o) => <ListingCard key={o.orderHash} order={o} />)}
            </div>
          )}
        </div>
      </FadeIn>

      {/* Recent Activity */}
      <FadeIn delay={0.08}>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="section-label">On-chain</p>
              <div className="flex items-center gap-2 mt-0.5">
                <Activity className={`h-4 w-4 ${BRAND.blue.text}`} />
                <h2 className="text-lg font-bold">Recent Activity</h2>
              </div>
            </div>
            <Button variant="ghost" size="sm" asChild className="gap-1 text-muted-foreground">
              <Link href="/activities">
                View all <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>

          <div className="rounded-xl border border-border overflow-hidden">
            {activitiesLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-3 py-3 border-b border-border/50 last:border-0">
                  <Skeleton className="h-8 w-8 rounded-lg shrink-0" />
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
              activities.map((a, i) => (
                <div key={`${a.type}-${a.timestamp}-${a.nftTokenId ?? a.tokenId ?? ""}`} className="border-b border-border/50 last:border-0">
                  <ActivityRow event={a} isLatest={i === 0} />
                </div>
              ))
            )}
          </div>
        </div>
      </FadeIn>
    </div>
  );
}
