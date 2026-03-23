"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useOrders } from "@/hooks/use-orders";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FadeIn } from "@/components/ui/motion-primitives";
import { CommunityActivity } from "@/components/home/community-activity";
import { BRAND } from "@/lib/brand";
import { ipfsToHttp, timeAgo, formatDisplayPrice } from "@/lib/utils";
import {
  ArrowRight,
  Tag,
  Image as ImageIcon,
} from "lucide-react";
import type { ApiOrder } from "@medialane/sdk";

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

// ─── Feed section ─────────────────────────────────────────────────────────────

export function FeedSection() {
  const { orders, isLoading: ordersLoading } = useOrders({ status: "ACTIVE", sort: "recent", limit: 6 });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* New Listings */}
      <FadeIn>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="section-label">NFTs</p>
              <div className="flex items-center gap-2 mt-0.5">
                <Tag className={`h-4 w-4 ${BRAND.rose.text}`} />
                <h2 className="text-lg font-bold">Fresh Markets</h2>
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

      {/* Recent Activity — uses the same CommunityActivity widget from the homepage */}
      <FadeIn delay={0.08}>
        <CommunityActivity />
      </FadeIn>
    </div>
  );
}
