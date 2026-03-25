"use client";

import { useMemo } from "react";
import { useUserOrders } from "./use-orders";
import { useActivitiesByAddress } from "./use-activities";
import { getSeenOffers, markOffersAsSeen } from "./use-unread-offers";
import type { ApiOrder, ApiActivity } from "@medialane/sdk";

export function useNotifications(address: string | null | undefined) {
  const { orders } = useUserOrders(address ?? null);
  const { activities } = useActivitiesByAddress(address ?? null);

  const unseenOffers: ApiOrder[] = useMemo(() => {
    if (!address) return [];
    const seen = getSeenOffers();
    return orders.filter(
      (o) =>
        o.status === "ACTIVE" &&
        o.offer.itemType === "ERC20" &&
        o.offerer.toLowerCase() !== address.toLowerCase() &&
        !seen.has(o.orderHash)
    );
  }, [orders, address]);

  function markAllSeen() {
    markOffersAsSeen(unseenOffers.map((o) => o.orderHash));
  }

  return {
    unreadCount: unseenOffers.length,
    unseenOffers,
    recentActivities: (activities as ApiActivity[]).slice(0, 5),
    markAllSeen,
  };
}
