"use client";

import { useState } from "react";
import { DiscoverActivityStrip } from "@medialane/ui";
import { useOrders } from "@/hooks/use-orders";
import { useWalletNativeSession } from "@/hooks/use-wallet-native-session";
import { PurchaseDialog } from "@/components/marketplace/purchase-dialog";
import { normalizeAddress } from "@medialane/sdk";
import type { ApiOrder } from "@medialane/sdk";

/** The "Activity" recent-listings carousel. The old "Community" carousel that
 *  used to live alongside this was replaced by CommunitySection (2-column
 *  activities + scoreboard) — see discover/community-section.tsx. */
export function FeedSection() {
  const { orders, isLoading } = useOrders({ status: "ACTIVE", sort: "recent", limit: 10 });
  const { address: walletAddress } = useWalletNativeSession();
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
          normalizeAddress("STARKNET", order.offerer) === normalizeAddress("STARKNET", walletAddress)
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
