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
import { ipfsToHttp, timeAgo , formatDisplayPrice} from "@/lib/utils";
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

// ─── Recent listings ──────────────────────────────────────────────────────────

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
        <p className="price-value text-sm">{formatDisplayPrice(order.price.formatted) ?? "—"}</p>
        <p className="text-[10px] text-muted-foreground">{timeAgo(order.createdAt)}</p>
      </div>
    </Link>
  );
}

// ─── Activity feed ────────────────────────────────────────────────────────────

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
          <p className="price-value text-sm">{formatDisplayPrice(event.price.formatted)}</p>
        )}
        <p className="text-[10px] text-muted-foreground">{timeAgo(event.timestamp)}</p>
      </div>
    </Link>
  );
}

// ─── Feed section (exported) ──────────────────────────────────────────────────

export function FeedSection() {
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
                <Tag className={`h-4 w-4 ${BRAND.rose.text}`} />
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
              activities.map((a) => (
                // Refactor #4: composite key instead of array index
                <ActivityRow
                  key={`${a.type}-${a.timestamp}-${a.nftTokenId ?? a.tokenId ?? ""}`}
                  event={a}
                />
              ))
            )}
          </div>
        </div>
      </FadeIn>
    </section>
  );
}
