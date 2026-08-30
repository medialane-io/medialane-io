"use client";

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
  } catch {  }
}

