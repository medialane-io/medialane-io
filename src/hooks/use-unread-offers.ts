"use client";

import { useEffect, useState } from "react";
import { useUserOrders } from "./use-orders";

const STORAGE_KEY = "medialane-seen-offers";

export function getSeenOffers(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || !parsed.every((x) => typeof x === "string")) return new Set();
    return new Set(parsed);
  } catch {
    return new Set();
  }
}

export function markOffersAsSeen(hashes: string[]) {
  if (typeof window === "undefined") return;
  try {
    const seen = getSeenOffers();
    hashes.forEach((h) => seen.add(h));
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...seen]));
  } catch { /* ignore */ }
}

export function useUnreadOffers(address: string | null | undefined) {
  const { orders } = useUserOrders(address ?? null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!address || orders.length === 0) { setUnreadCount(0); return; }
    // Received offers: ACTIVE bids where consideration (NFT) owner is this address.
    // Exclude offers sent by this user themselves.
    const receivedOffers = orders.filter(
      (o) =>
        o.status === "ACTIVE" &&
        o.offer.itemType === "ERC20" &&
        o.offerer.toLowerCase() !== address.toLowerCase()
    );
    const seen = getSeenOffers();
    const unseen = receivedOffers.filter((o) => !seen.has(o.orderHash));
    setUnreadCount(unseen.length);
  }, [orders, address]);

  return unreadCount;
}
