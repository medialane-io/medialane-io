"use client";

import { useState, useEffect, useRef } from "react";
import { useOrders } from "@/hooks/use-orders";
import { ListingCard, ListingCardSkeleton } from "./listing-card";
import { PurchaseDialog } from "./purchase-dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import type { ApiOrder } from "@medialane/sdk";

const PAGE_SIZE = 12;

interface ListingsGridProps {
  sort?: string;
  currency?: string;
  orderType?: string; // "listings" | "offers" | "" (all)
  minPrice?: string;
  maxPrice?: string;
}

export function ListingsGrid({ sort = "recent", currency, orderType = "", minPrice, maxPrice }: ListingsGridProps = {}) {
  const [page, setPage] = useState(1);
  const [allOrders, setAllOrders] = useState<ApiOrder[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<ApiOrder | null>(null);
  const [purchaseOpen, setPurchaseOpen] = useState(false);

  // Reset accumulated orders when filters change
  const prevFilters = useRef({ sort, currency, orderType, minPrice, maxPrice });
  useEffect(() => {
    const f = prevFilters.current;
    if (f.sort !== sort || f.currency !== currency || f.orderType !== orderType || f.minPrice !== minPrice || f.maxPrice !== maxPrice) {
      prevFilters.current = { sort, currency, orderType, minPrice, maxPrice };
      setPage(1);
      setAllOrders([]);
    }
  }, [sort, currency, orderType, minPrice, maxPrice]);

  const { orders, meta, isLoading } = useOrders({
    status: "ACTIVE",
    sort,
    ...(currency ? { currency } : {}),
    ...(minPrice ? { minPrice } : {}),
    ...(maxPrice ? { maxPrice } : {}),
    page,
    limit: PAGE_SIZE,
  });

  // Append incoming page to accumulated list
  useEffect(() => {
    if (isLoading) return;
    if (page === 1) {
      setAllOrders(orders);
    } else {
      setAllOrders((prev) => {
        const existing = new Set(prev.map((o) => o.orderHash));
        const newItems = orders.filter((o) => !existing.has(o.orderHash));
        return newItems.length > 0 ? [...prev, ...newItems] : prev;
      });
    }
  }, [orders, isLoading, page]);

  // Client-side type filter (backend doesn't support itemType param)
  const displayedOrders = orderType === "listings"
    ? allOrders.filter((o) => o.offer.itemType === "ERC721")
    : orderType === "offers"
    ? allOrders.filter((o) => o.offer.itemType === "ERC20")
    : allOrders;

  const isInitialLoading = isLoading && allOrders.length === 0;
  const isLoadingMore = isLoading && allOrders.length > 0;
  const hasMore = meta ? allOrders.length < meta.total : false;

  const handleBuy = (order: ApiOrder) => {
    setSelectedOrder(order);
    setPurchaseOpen(true);
  };

  if (isInitialLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {Array.from({ length: PAGE_SIZE }).map((_, i) => (
          <ListingCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (displayedOrders.length === 0 && !isLoading) {
    const emptyHeading =
      orderType === "offers" ? "No offers yet" : "No listings yet";
    const emptyBody =
      orderType === "offers"
        ? "No active bids on any assets right now."
        : "Be the first to list your IP asset on Medialane.";
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
        <p className="text-2xl font-bold">{emptyHeading}</p>
        <p className="text-muted-foreground max-w-sm">{emptyBody}</p>
        {orderType !== "offers" && (
          <Button variant="outline" asChild>
            <a href="/create">Create & List</a>
          </Button>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {displayedOrders.map((order) => (
            <ListingCard key={order.orderHash} order={order} onBuy={handleBuy} />
          ))}
          {isLoadingMore &&
            Array.from({ length: PAGE_SIZE }).map((_, i) => (
              <ListingCardSkeleton key={`loading-${i}`} />
            ))}
        </div>

        {(hasMore || isLoadingMore) && (
          <div className="flex justify-center pt-2">
            <Button
              variant="outline"
              size="lg"
              disabled={isLoadingMore}
              onClick={() => setPage((p) => p + 1)}
            >
              {isLoadingMore ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Loading…
                </>
              ) : (
                `Load more ${meta ? `(${meta.total - allOrders.length} remaining)` : ""}`
              )}
            </Button>
          </div>
        )}

        {!hasMore && displayedOrders.length > 0 && meta && meta.total > PAGE_SIZE && (
          <p className="text-center text-xs text-muted-foreground">
            All {displayedOrders.length} listings shown
          </p>
        )}
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
