"use client";

export const dynamic = "force-dynamic";

import { useOrders } from "@/hooks/use-orders";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { AddressDisplay } from "@/components/shared/address-display";
import Link from "next/link";
import { formatPrice, getCurrency } from "@/lib/utils";
import { EXPLORER_URL } from "@/lib/constants";
import { ExternalLink } from "lucide-react";

const STATUS_LABELS: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  ACTIVE: { label: "Listed", variant: "default" },
  FULFILLED: { label: "Sold", variant: "secondary" },
  CANCELLED: { label: "Cancelled", variant: "outline" },
  EXPIRED: { label: "Expired", variant: "outline" },
};

export function ActivitiesFeed() {
  const { orders, isLoading } = useOrders({ sort: "recent", limit: 50 });

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 10 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="py-16 text-center text-muted-foreground">No activity yet.</div>
    );
  }

  return (
    <div className="divide-y divide-border rounded-lg border">
      {orders.map((order) => {
        const statusInfo = STATUS_LABELS[order.status] ?? { label: order.status, variant: "outline" as const };
        const currency = getCurrency(order.consideration.token);

        return (
          <div key={order.orderHash} className="flex items-center justify-between p-4 gap-4 hover:bg-muted/20 transition-colors">
            <div className="flex items-center gap-3 min-w-0">
              <Badge variant={statusInfo.variant} className="shrink-0 text-[10px]">
                {statusInfo.label}
              </Badge>
              <div className="min-w-0">
                <Link
                  href={`/asset/${order.nftContract}/${order.nftTokenId}`}
                  className="font-mono text-sm font-semibold hover:underline truncate block"
                >
                  #{order.nftTokenId}
                </Link>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span>by</span>
                  <AddressDisplay address={order.offerer} chars={3} showCopy={false} />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <div className="text-right">
                <p className="font-bold text-sm">
                  {order.price.formatted} {order.price.currency}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {new Date(order.createdAt).toLocaleDateString()}
                </p>
              </div>
              <a
                href={`${EXPLORER_URL}/tx/${order.txHash.created}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
              </a>
            </div>
          </div>
        );
      })}
    </div>
  );
}
