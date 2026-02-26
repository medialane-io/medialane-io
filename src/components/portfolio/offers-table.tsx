"use client";

import { useUserOrders } from "@/hooks/use-orders";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { timeUntil } from "@/lib/utils";
import { EXPLORER_URL } from "@/lib/constants";
import { ExternalLink } from "lucide-react";

interface OffersTableProps {
  address: string;
}

export function OffersTable({ address }: OffersTableProps) {
  const { orders, isLoading } = useUserOrders(address);

  const myOffers = orders.filter(
    (o) => o.offer.itemType === "ERC20" && o.status === "ACTIVE"
  );

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}
      </div>
    );
  }

  if (myOffers.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="font-semibold">No active offers</p>
        <p className="text-sm text-muted-foreground mt-1">
          Browse the marketplace to make offers on assets.
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border rounded-lg border">
      {myOffers.map((order) => (
        <div key={order.orderHash} className="flex items-center justify-between p-4 gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-semibold">#{order.nftTokenId}</span>
              <Badge variant="secondary" className="text-[10px]">Offer</Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Expires {timeUntil(order.endTime)}
            </p>
          </div>
          <p className="font-bold text-sm shrink-0">
            {order.price.formatted} {order.price.currency}
          </p>
          <a
            href={`${EXPLORER_URL}/tx/${order.txHash.created}`}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0"
          >
            <ExternalLink className="h-4 w-4 text-muted-foreground hover:text-foreground" />
          </a>
        </div>
      ))}
    </div>
  );
}
