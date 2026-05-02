"use client";

import { useMemo } from "react";
import useSWR from "swr";
import { useUserOrders } from "./use-orders";
import { useActivitiesByAddress } from "./use-activities";
import { getReadIds, markRead } from "@/lib/notification-storage";
import { formatActivity, formatOrderNotification } from "@/lib/format-activity";
import type { Notification, Announcement } from "@/types/notification";
import type { ApiActivity } from "@medialane/sdk";

async function fetchAnnouncements(): Promise<Announcement[]> {
  const res = await fetch("/api/announcements");
  if (!res.ok) return [];
  return res.json();
}

export function useNotifications(address: string | null | undefined) {
  const { orders } = useUserOrders(address ?? null);
  const { activities } = useActivitiesByAddress(address ?? null);
  const { data: announcements = [] } = useSWR<Announcement[]>(
    "announcements",
    fetchAnnouncements,
    { revalidateOnFocus: false, dedupingInterval: 60_000 }
  );

  const notifications: Notification[] = useMemo(() => {
    const readIds = getReadIds();
    const items: Notification[] = [];

    // Received offers (ACTIVE ERC20 bids not placed by this user)
    if (address) {
      orders
        .filter(
          (o) =>
            o.status === "ACTIVE" &&
            o.offer.itemType === "ERC20" &&
            o.offerer.toLowerCase() !== address.toLowerCase()
        )
        .forEach((order) => {
          const id = `order-${order.orderHash}`;
          const fmt = formatOrderNotification(order);
          items.push({
            id,
            type: "offer",
            ...fmt,
            timestamp: order.createdAt ?? new Date().toISOString(),
            isUnread: !readIds.has(id),
          });
        });
    }

    // Personal activity events
    (activities as ApiActivity[]).slice(0, 30).forEach((event) => {
      const id = `activity-${event.txHash}-${event.type}-${event.nftTokenId ?? ""}`;
      const fmt = formatActivity(event);
      items.push({
        id,
        type: event.type as Notification["type"],
        ...fmt,
        timestamp: event.timestamp ?? new Date().toISOString(),
        isUnread: !readIds.has(id),
      });
    });

    // Announcements
    announcements.forEach((ann) => {
      const id = `ann-${ann.id}`;
      items.push({
        id,
        type: "announcement",
        title: ann.title,
        description: ann.body,
        image: ann.image,
        href: ann.href,
        timestamp: ann.created_at,
        isUnread: !readIds.has(id),
      });
    });

    // Chronological, newest first
    items.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return items;
  }, [orders, activities, announcements, address]);

  const unreadCount = notifications.filter((n) => n.isUnread).length;

  return {
    notifications,
    unreadCount,
    markAllRead: () => markRead(notifications.map((n) => n.id)),
    markRead:    (id: string) => markRead([id]),
  };
}
