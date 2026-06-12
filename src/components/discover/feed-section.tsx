"use client";

import { useState, useEffect } from "react";
import { DiscoverFeedSection } from "@medialane/ui";
import { useOrders } from "@/hooks/use-orders";
import { useActivities } from "@/hooks/use-activities";
import { useSessionKey } from "@/hooks/use-session-key";
import { PurchaseDialog } from "@/components/marketplace/purchase-dialog";
import { EXPLORER_URL } from "@/lib/constants";
import type { ApiOrder } from "@medialane/sdk";

export function FeedSection() {
  const { orders, isLoading } = useOrders({ status: "ACTIVE", sort: "recent", limit: 10 });
  const { activities, isLoading: activitiesLoading } = useActivities({ limit: 12 });
  const { walletAddress } = useSessionKey();
  const [buyOrder, setBuyOrder] = useState<ApiOrder | null>(null);
  const [lastUpdated, setLastUpdated] = useState(() => new Date().toISOString());

  useEffect(() => {
    if (!activitiesLoading) setLastUpdated(new Date().toISOString());
  }, [activities, activitiesLoading]);

  return (
    <>
      <DiscoverFeedSection
        orders={orders}
        isLoading={isLoading}
        activities={activities}
        activitiesLoading={activitiesLoading}
        lastUpdated={lastUpdated}
        getAssetHref={(contract, tokenId) => `/asset/${contract}/${tokenId}`}
        getActorHref={(address) => `/creator/${address}`}
        explorerUrl={EXPLORER_URL}
        marketplaceHref="/marketplace"
        activitiesHref="/activities"
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
