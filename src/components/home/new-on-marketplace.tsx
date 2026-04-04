"use client";

import { useState } from "react";
import { Tag } from "lucide-react";
import { useOrders } from "@/hooks/use-orders";
import { ListingCard, ListingCardSkeleton } from "@/components/marketplace/listing-card";
import { ScrollSection } from "@/components/shared/scroll-section";
import { PurchaseDialog } from "@/components/marketplace/purchase-dialog";
import type { ApiOrder } from "@medialane/sdk";

export function NewOnMarketplace() {
  const { orders, isLoading } = useOrders({ status: "ACTIVE", limit: 10, page: 1 });
  const [buyOrder, setBuyOrder] = useState<ApiOrder | null>(null);

  const listings = orders.filter((o) => o.offer.itemType === "ERC721").slice(0, 10);

  return (
    <>
      <ScrollSection
        icon={<Tag className="h-3.5 w-3.5 text-white" />}
        iconBg="bg-gradient-to-br from-rose-500 to-pink-600 shadow-md shadow-rose-500/20"
        title="New listings"
        href="/marketplace"
        linkLabel="Marketplace"
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
                No listings yet.{" "}
                <a href="/create/asset" className="text-primary hover:underline">
                  Be the first to list an asset.
                </a>
              </p>
            )
          : listings.map((order) => (
              <div key={order.orderHash} className="w-72 snap-start shrink-0">
                <ListingCard order={order} onBuy={() => setBuyOrder(order)} />
              </div>
            ))}
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
