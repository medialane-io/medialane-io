import { mutate } from "swr";

/**
 * Immediately invalidates SWR caches for both owned tokens and user collections
 * for the given wallet address. Call this after a successful mint or collection
 * creation so the portfolio reflects the new state without waiting for the
 * next auto-refresh cycle.
 */
export function invalidatePortfolioCache(address: string) {
  mutate((key) => typeof key === "string" && key.startsWith(`tokens-owned-${address}-`), undefined, { revalidate: true });
  mutate((key) => typeof key === "string" && key.startsWith(`collections-owner-${address}`), undefined, { revalidate: true });
}
