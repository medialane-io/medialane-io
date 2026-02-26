"use client";

import { useState } from "react";
import { useUserOrders } from "@/hooks/use-orders";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PinDialog } from "@/components/chipi/pin-dialog";
import { useMarketplace } from "@/hooks/use-marketplace";
import { timeUntil, formatPrice } from "@/lib/utils";
import { ExternalLink } from "lucide-react";
import { EXPLORER_URL } from "@/lib/constants";
import type { ApiOrder } from "@medialane/sdk";

interface ListingsTableProps {
  address: string;
}

export function ListingsTable({ address }: ListingsTableProps) {
  const { orders, isLoading, mutate } = useUserOrders(address);
  const { cancelOrder, isProcessing } = useMarketplace();
  const [pinOpen, setPinOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<ApiOrder | null>(null);

  const myListings = orders.filter(
    (o) => o.offer.itemType === "ERC721" && o.status === "ACTIVE"
  );

  const handleCancel = (order: ApiOrder) => {
    setSelectedOrder(order);
    setPinOpen(true);
  };

  const handlePin = async (pin: string) => {
    setPinOpen(false);
    if (!selectedOrder) return;
    await cancelOrder({
      orderHash: selectedOrder.orderHash,
      offererAddress: selectedOrder.offerer,
      pin,
    });
    mutate();
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}
      </div>
    );
  }

  if (myListings.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="font-semibold">No active listings</p>
        <p className="text-sm text-muted-foreground mt-1">List an asset from your portfolio to see it here.</p>
      </div>
    );
  }

  return (
    <>
      <div className="divide-y divide-border rounded-lg border">
        {myListings.map((order) => (
          <div key={order.orderHash} className="flex items-center justify-between p-4 gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-semibold">#{order.nftTokenId}</span>
                <Badge variant="outline" className="text-[10px]">{order.status}</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Expires {timeUntil(order.endTime)}
              </p>
            </div>

            <div className="text-right shrink-0">
              <p className="font-bold text-sm">{order.price.formatted} {order.price.currency}</p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <a
                href={`${EXPLORER_URL}/tx/${order.txHash.created}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-4 w-4 text-muted-foreground hover:text-foreground" />
              </a>
              <Button
                size="sm"
                variant="destructive"
                disabled={isProcessing}
                onClick={() => handleCancel(order)}
              >
                Cancel
              </Button>
            </div>
          </div>
        ))}
      </div>

      <PinDialog
        open={pinOpen}
        onSubmit={handlePin}
        onCancel={() => setPinOpen(false)}
        title="Cancel listing"
        description={`Enter PIN to cancel the listing for token #${selectedOrder?.nftTokenId}.`}
      />
    </>
  );
}
