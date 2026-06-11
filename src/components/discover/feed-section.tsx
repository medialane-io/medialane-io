"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Tag, Activity, RefreshCw } from "lucide-react";
import { FadeIn } from "@/components/ui/motion-primitives";
import { ScrollSection } from "@/components/shared/scroll-section";
import { ListingCard, ListingCardSkeleton } from "@/components/marketplace/listing-card";
import { ActivityCard, ActivityCardSkeleton } from "@/components/shared/activity-card";
import { PurchaseDialog } from "@/components/marketplace/purchase-dialog";
import { useOrders } from "@/hooks/use-orders";
import { useActivities } from "@/hooks/use-activities";
import { useSessionKey } from "@/hooks/use-session-key";
import { timeAgo } from "@/lib/utils";
import type { ApiOrder } from "@medialane/sdk";

/** Markets activity — horizontal carousel of recent listings (frontpage New-listings style). */
function MarketsStrip() {
  const { orders, isLoading } = useOrders({ status: "ACTIVE", sort: "recent", limit: 10 });
  const { walletAddress } = useSessionKey();
  const [buyOrder, setBuyOrder] = useState<ApiOrder | null>(null);

  const listings = orders.filter((o) => o.offer.itemType === "ERC721" || o.offer.itemType === "ERC1155");

  return (
    <>
      <ScrollSection
        icon={<Tag className="h-3.5 w-3.5 text-white" />}
        iconBg="bg-gradient-to-br from-rose-500 to-pink-600 shadow-md shadow-rose-500/20"
        title="Activity"
        href="/marketplace"
        linkLabel="View all"
      >
        {isLoading
          ? Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="w-72 snap-start shrink-0">
                <ListingCardSkeleton />
              </div>
            ))
          : listings.length === 0
          ? (
              <p className="text-sm text-muted-foreground py-4">
                No active listings yet.{" "}
                <Link href="/create/asset" className="text-primary hover:underline">
                  Be the first to list an asset.
                </Link>
              </p>
            )
          : listings.map((order) => {
              const isOwner = !!walletAddress && !!order.offerer &&
                order.offerer.toLowerCase() === walletAddress.toLowerCase();
              return (
                <div key={order.orderHash} className="w-72 snap-start shrink-0">
                  <ListingCard
                    order={order}
                    isOwner={isOwner}
                    onBuy={isOwner ? undefined : () => setBuyOrder(order)}
                  />
                </div>
              );
            })}
      </ScrollSection>

      {buyOrder && (
        <PurchaseDialog
          open={!!buyOrder}
          onOpenChange={(v) => { if (!v) setBuyOrder(null); }}
          order={buyOrder}
        />
      )}
    </>
  );
}

/** Community — horizontal carousel of recent on-chain activity. */
function CommunityStrip() {
  const { activities, isLoading } = useActivities({ limit: 12 });
  const [lastUpdated, setLastUpdated] = useState(() => new Date().toISOString());
  // Tick every 15s so the "updated X ago" label refreshes visually
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!isLoading) setLastUpdated(new Date().toISOString());
  }, [activities, isLoading]);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 15_000);
    return () => clearInterval(id);
  }, []);

  return (
    <ScrollSection
      icon={<Activity className="h-3.5 w-3.5 text-white" />}
      iconBg="bg-gradient-to-br from-indigo-500 to-blue-600 shadow-md shadow-indigo-500/20"
      title="Community"
      subtitle={
        <span className="flex items-center gap-1">
          <RefreshCw className="h-2.5 w-2.5" />
          Updated {timeAgo(lastUpdated)}
        </span>
      }
      href="/activities"
      linkLabel="Activities"
    >
      {isLoading
        ? Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="w-56 sm:w-64 snap-start shrink-0">
              <ActivityCardSkeleton />
            </div>
          ))
        : activities.length === 0
        ? (
            <p className="text-sm text-muted-foreground py-4">
              No activity yet. Be the first to trade on Medialane!
            </p>
          )
        : activities.map((act, i) => {
            const key = act.txHash
              ? `${act.txHash}-${act.type}-${act.nftTokenId ?? ""}`
              : `activity-${i}`;
            return (
              <div key={key} className="w-56 sm:w-64 snap-start shrink-0">
                <ActivityCard activity={act} />
              </div>
            );
          })}
    </ScrollSection>
  );
}

export function FeedSection() {
  return (
    <div className="space-y-14 sm:space-y-20">
      <FadeIn>
        <MarketsStrip />
      </FadeIn>
      <FadeIn delay={0.08}>
        <CommunityStrip />
      </FadeIn>
    </div>
  );
}
