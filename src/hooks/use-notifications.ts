"use client";

import { useCallback, useMemo, useState } from "react";
import useSWR from "swr";
import { useUserOrders, useReceivedOffers } from "./use-orders";
import { useActivitiesByAddress } from "./use-activities";
import { getReadIds, markRead } from "@/lib/notification-storage";
import {
  formatActivity,
  formatOrderNotification,
  formatOfferAcceptedNotification,
  formatAssetReceivedNotification,
} from "@/lib/format-activity";
import type { Notification, Announcement } from "@/types/notification";
import type { ApiActivity } from "@medialane/sdk";

async function fetchAnnouncements(): Promise<Announcement[]> {
  const res = await fetch("/api/announcements");
  if (!res.ok) return [];
  return res.json();
}

export function useNotifications(address: string | null | undefined) {
  const [readIds, setReadIds] = useState<Set<string>>(() => getReadIds());

  // Offers this user placed (to detect accepted ones)
  const { orders: userOrders } = useUserOrders(address ?? null);
  // Offers received on tokens the user holds
  const { orders: receivedOffers } = useReceivedOffers(address ?? null);
  const { activities } = useActivitiesByAddress(address ?? null);
  const { data: announcements = [] } = useSWR<Announcement[]>(
    "announcements",
    fetchAnnouncements,
    { revalidateOnFocus: false, dedupingInterval: 60_000 }
  );

  const notifications: Notification[] = useMemo(() => {
    const items: Notification[] = [];

    // ── Offers accepted (buyer: my ERC20 bid was fulfilled) ──────────────────
    userOrders
      .filter((o) => o.offer.itemType === "ERC20" && o.status === "FULFILLED")
      .forEach((order) => {
        const id = `offer-accepted-${order.orderHash}`;
        const fmt = formatOfferAcceptedNotification(order);
        items.push({
          id,
          type: "offer_accepted",
          priority: "spotlight",
          celebratory: true,
          ...fmt,
          timestamp: order.updatedAt ?? order.createdAt ?? new Date().toISOString(),
          isUnread: !readIds.has(id),
          metadata: {
            amount: order.price?.formatted ?? undefined,
            currency: order.price?.currency ?? undefined,
            txHash: order.txHash?.fulfilled ?? undefined,
            assetName: order.token?.name ?? undefined,
          },
        });
      });

    // ── Received offers (someone bid on my asset) ────────────────────────────
    receivedOffers.forEach((order) => {
      const id = `order-${order.orderHash}`;
      const fmt = formatOrderNotification(order);
      items.push({
        id,
        type: "offer",
        priority: "spotlight",
        celebratory: false,
        ...fmt,
        timestamp: order.createdAt ?? new Date().toISOString(),
        isUnread: !readIds.has(id),
        metadata: {
          amount: order.price?.formatted ?? undefined,
          currency: order.price?.currency ?? undefined,
          assetName: order.token?.name ?? undefined,
        },
      });
    });

    // ── Activity events ──────────────────────────────────────────────────────
    (activities as ApiActivity[]).slice(0, 50).forEach((event) => {
      const id = `activity-${event.txHash}-${event.type}-${event.nftTokenId ?? ""}`;

      // Asset received: transfer where this user is the recipient
      if (
        event.type === "transfer" &&
        address &&
        event.to?.toLowerCase() === address.toLowerCase()
      ) {
        const fmt = formatAssetReceivedNotification(event);
        items.push({
          id,
          type: "asset_received",
          priority: "spotlight",
          celebratory: true,
          ...fmt,
          timestamp: event.timestamp ?? new Date().toISOString(),
          isUnread: !readIds.has(id),
          metadata: {
            txHash: event.txHash ?? undefined,
            assetName: event.token?.name ?? undefined,
          },
        });
        return;
      }

      // Sale (seller perspective): activity sale where offerer = address
      const isMySale =
        event.type === "sale" &&
        address &&
        (event.offerer?.toLowerCase() === address.toLowerCase() ||
          event.from?.toLowerCase() === address.toLowerCase());

      const fmt = formatActivity(event);
      items.push({
        id,
        type: event.type as Notification["type"],
        priority: isMySale ? "spotlight" : "normal",
        celebratory: !!isMySale,
        ...fmt,
        timestamp: event.timestamp ?? new Date().toISOString(),
        isUnread: !readIds.has(id),
        metadata: {
          amount: event.price?.formatted ?? undefined,
          currency: event.price?.currency ?? undefined,
          txHash: event.txHash ?? undefined,
          assetName: event.token?.name ?? undefined,
        },
      });
    });

    // ── Announcements ────────────────────────────────────────────────────────
    announcements.forEach((ann) => {
      const id = `ann-${ann.id}`;
      items.push({
        id,
        type: "announcement",
        priority: ann.pinned ? "spotlight" : "normal",
        celebratory: false,
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
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return items;
  }, [userOrders, receivedOffers, activities, announcements, address, readIds]);

  const unreadCount = notifications.filter((n) => n.isUnread).length;

  const markNotificationsRead = useCallback((ids: string[]) => {
    markRead(ids);
    setReadIds(getReadIds());
  }, []);

  return {
    notifications,
    unreadCount,
    markAllRead: () => markNotificationsRead(notifications.map((n) => n.id)),
    markRead: (id: string) => markNotificationsRead([id]),
  };
}
