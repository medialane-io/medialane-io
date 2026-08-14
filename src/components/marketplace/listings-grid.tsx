"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useOrders } from "@/hooks/use-orders";
import { useWalletNativeSession } from "@/hooks/use-wallet-native-session";
import { ListingCard, ListingCardSkeleton } from "./listing-card";
import { PurchaseDialog } from "./purchase-dialog";
import { Button } from "@/components/ui/button";
import { LoadMoreSentinel } from "@medialane/ui";
import { normalizeAddress } from "@medialane/sdk";
import type { ApiOrder, SortOrder } from "@medialane/sdk";

const PAGE_SIZE = 50;

interface ListingsGridProps {
  sort?: string;
  currency?: string;
  orderType?: string;
  minPrice?: string;
  maxPrice?: string;
}

export function ListingsGrid({ sort = "recent", currency, orderType = "", minPrice, maxPrice }: ListingsGridProps = {}) {
  const { address: walletAddress } = useWalletNativeSession();
  const [page, setPage] = useState(1);
  const [allOrders, setAllOrders] = useState<ApiOrder[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<ApiOrder | null>(null);
  const [purchaseOpen, setPurchaseOpen] = useState(false);

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
    sort: sort as SortOrder,
    ...(currency ? { currency } : {}),
    ...(minPrice ? { minPrice } : {}),
    ...(maxPrice ? { maxPrice } : {}),
    page,
    limit: PAGE_SIZE,
  });

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

  const displayedOrders = orderType === "offers"
    ? allOrders.filter((o) => o.offer.itemType === "ERC20")
    : allOrders.filter((o) => o.offer.itemType === "ERC721" || o.offer.itemType === "ERC1155");

  const isInitialLoading = isLoading && allOrders.length === 0;
  const isLoadingMore = isLoading && allOrders.length > 0;
  const hasMore = meta ? allOrders.length < (meta.total ?? 0) : false;

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
        : "Be the first to list your digital asset on Medialane.";
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
        <p className="text-2xl font-bold">{emptyHeading}</p>
        <p className="text-muted-foreground max-w-sm">{emptyBody}</p>
        {orderType !== "offers" && (
          <Button variant="outline" asChild>
            <Link href="/create">Create & List</Link>
          </Button>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {displayedOrders.map((order) => {
            const isOwner = !!walletAddress && !!order.offerer &&
              normalizeAddress("STARKNET", order.offerer) === normalizeAddress("STARKNET", walletAddress);
            return (
              <ListingCard key={order.orderHash} order={order} onBuy={isOwner ? undefined : handleBuy} isOwner={isOwner} />
            );
          })}
          {isLoadingMore &&
            Array.from({ length: PAGE_SIZE }).map((_, i) => (
              <ListingCardSkeleton key={`loading-${i}`} />
            ))}
        </div>

        <LoadMoreSentinel
          hasMore={hasMore}
          isLoading={isLoadingMore}
          onLoadMore={() => setPage((p) => p + 1)}
        />

        {!hasMore && displayedOrders.length > 0 && meta && (meta.total ?? 0) > PAGE_SIZE && (
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
