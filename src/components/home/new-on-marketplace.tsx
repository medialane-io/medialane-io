"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useOrders } from "@/hooks/use-orders";
import { ListingCard, ListingCardSkeleton } from "@/components/marketplace/listing-card";
import { PurchaseDialog } from "@/components/marketplace/purchase-dialog";
import type { ApiOrder } from "@medialane/sdk";

export function NewOnMarketplace() {
  const { orders, isLoading } = useOrders({ status: "ACTIVE", limit: 6, page: 1 });
  const [buyOrder, setBuyOrder] = useState<ApiOrder | null>(null);

  // Only show actual listings (ERC721 in offer side = someone selling an NFT)
  const listings = orders.filter((o) => o.offer.itemType === "ERC721").slice(0, 6);

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">New on Marketplace</h2>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/marketplace" className="flex items-center gap-1">
            Browse all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => <ListingCardSkeleton key={i} />)
          : listings.length === 0
          ? (
              <p className="col-span-full text-sm text-muted-foreground py-4">
                No listings yet.{" "}
                <Link href="/create/asset" className="text-primary hover:underline">
                  Be the first to list an asset.
                </Link>
              </p>
            )
          : listings.map((order) => (
              <ListingCard
                key={order.orderHash}
                order={order}
                onBuy={() => setBuyOrder(order)}
              />
            ))}
      </div>

      {buyOrder && (
        <PurchaseDialog
          open={!!buyOrder}
          onOpenChange={(v) => { if (!v) setBuyOrder(null); }}
          order={buyOrder}
        />
      )}
    </section>
  );
}
