"use client";

import { useState } from "react";
import { useOrders } from "@/hooks/use-orders";
import { ListingCard, ListingCardSkeleton } from "./listing-card";
import { PurchaseDialog } from "./purchase-dialog";
import { Button } from "@/components/ui/button";
import type { ApiOrder } from "@medialane/sdk";

interface ListingsGridProps {
  sort?: string;
  currency?: string;
}

export function ListingsGrid({ sort = "recent", currency }: ListingsGridProps = {}) {
  const { orders, isLoading } = useOrders({
    status: "ACTIVE",
    sort,
    ...(currency ? { currency } : {}),
    limit: 24,
  });
  const [selectedOrder, setSelectedOrder] = useState<ApiOrder | null>(null);
  const [purchaseOpen, setPurchaseOpen] = useState(false);

  const handleBuy = (order: ApiOrder) => {
    setSelectedOrder(order);
    setPurchaseOpen(true);
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {Array.from({ length: 10 }).map((_, i) => (
          <ListingCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
        <p className="text-2xl font-bold">No listings yet</p>
        <p className="text-muted-foreground max-w-sm">
          Be the first to list your IP asset on Medialane.
        </p>
        <Button variant="outline" asChild>
          <a href="/create">Create & List</a>
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {orders.map((order) => (
          <ListingCard key={order.orderHash} order={order} onBuy={handleBuy} />
        ))}
      </div>

      {selectedOrder && (
        <PurchaseDialog
          order={selectedOrder}
          open={purchaseOpen}
          onOpenChange={(open) => {
            setPurchaseOpen(open);
            if (!open) setSelectedOrder(null);
          }}
        />
      )}
    </>
  );
}
