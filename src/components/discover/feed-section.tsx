"use client";

import { useState } from "react";
import { DiscoverActivityStrip } from "@medialane/ui";
import { useOrders } from "@/hooks/use-orders";
import { useSessionKey } from "@/hooks/use-session-key";
import { PurchaseDialog } from "@/components/marketplace/purchase-dialog";
import type { ApiOrder } from "@medialane/sdk";

/** The "Activity" recent-listings carousel. The old "Community" carousel that
 *  used to live alongside this was replaced by CommunitySection (2-column
 *  activities + scoreboard) — see discover/community-section.tsx. */
export function FeedSection() {
  const { orders, isLoading } = useOrders({ status: "ACTIVE", sort: "recent", limit: 10 });
  const { walletAddress } = useSessionKey();
  const [buyOrder, setBuyOrder] = useState<ApiOrder | null>(null);

  return (
    <>
      <DiscoverActivityStrip
        orders={orders}
        isLoading={isLoading}
        marketplaceHref="/marketplace"
        onBuyOrder={setBuyOrder}
        isOwnOrder={(order) =>
          !!walletAddress && !!order.offerer &&
          order.offerer.toLowerCase() === walletAddress.toLowerCase()
        }
      />

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
