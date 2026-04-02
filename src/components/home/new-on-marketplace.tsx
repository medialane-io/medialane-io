"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useOrders } from "@/hooks/use-orders";
import { ListingCard, ListingCardSkeleton } from "@/components/marketplace/listing-card";
import { PurchaseDialog } from "@/components/marketplace/purchase-dialog";
import type { ApiOrder } from "@medialane/sdk";

export function NewOnMarketplace() {
  const { orders, isLoading } = useOrders({ status: "ACTIVE", limit: 10, page: 1 });
  const [buyOrder, setBuyOrder] = useState<ApiOrder | null>(null);

  // Only show actual listings (ERC721 in offer side = someone selling an NFT)
  const listings = orders.filter((o) => o.offer.itemType === "ERC721").slice(0, 10);

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center shadow-md shadow-rose-500/20">
            <Tag className="h-3.5 w-3.5 text-white" />
          </div>
          <h2 className="text-lg sm:text-xl font-semibold">New listings</h2>
        </div>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/marketplace" className="flex items-center gap-1 text-muted-foreground hover:text-foreground">
            Marketplace <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>

      <div className="w-full overflow-x-auto scrollbar-hide">
        <div className="flex gap-4 snap-x snap-mandatory pb-2" style={{ width: "max-content" }}>
          {isLoading
            ? Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="w-72 snap-start shrink-0">
                  <ListingCardSkeleton />
                </div>
              ))
            : listings.length === 0
            ? (
                <p className="text-sm text-muted-foreground py-4">
                  No listings yet.{" "}
                  <Link href="/create/asset" className="text-primary hover:underline">
                    Be the first to list an asset.
                  </Link>
                </p>
              )
            : listings.map((order) => (
                <div key={order.orderHash} className="w-72 snap-start shrink-0">
                  <ListingCard
                    order={order}
                    onBuy={() => setBuyOrder(order)}
                  />
                </div>
              ))}
        </div>
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
