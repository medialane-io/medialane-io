"use client";

import Link from "next/link";
import { ArrowRight, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FadeIn } from "@/components/ui/motion-primitives";
import { CommunityActivity } from "@/components/home/community-activity";
import { ListingCard } from "@/components/marketplace/listing-card";
import { BRAND } from "@/lib/brand";
import { useOrders } from "@/hooks/use-orders";

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

export function FeedSection() {
  const { orders, isLoading } = useOrders({ status: "ACTIVE", sort: "recent", limit: 6 });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* New Listings */}
      <FadeIn>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="section-label">Markets</p>
              <div className="flex items-center gap-2 mt-0.5">
                <Tag className={`h-4 w-4 ${BRAND.rose.text}`} />
                <h2 className="text-lg font-bold">Activity</h2>
              </div>
            </div>
            <Button variant="ghost" size="sm" asChild className="gap-1 text-muted-foreground">
              <Link href="/marketplace">
                View all <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-3 gap-3">
              {Array.from({ length: 6 }).map((_, i) => <ListingCardSkeleton key={i} />)}
            </div>
          ) : orders.length === 0 ? (
            <div className="rounded-xl border border-border py-12 text-center text-sm text-muted-foreground">
              No active listings yet.
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {orders.map((o) => <ListingCard key={o.orderHash} order={o} compact />)}
            </div>
          )}
        </div>
      </FadeIn>

      {/* Recent Activity */}
      <FadeIn delay={0.08}>
        <CommunityActivity />
      </FadeIn>
    </div>
  );
}
