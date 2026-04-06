import { mutate } from "swr";
import { normalizeAddress } from "@/lib/utils";

/**
 * Immediately invalidates SWR caches for both owned tokens and user collections
 * for the given wallet address. Call this after a successful mint or collection
 * creation so the portfolio reflects the new state without waiting for the
 * next auto-refresh cycle.
 */
export function invalidatePortfolioCache(address: string) {
  const normalized = normalizeAddress(address);
  mutate((key) => typeof key === "string" && key.startsWith(`tokens-owned-${normalized}-`), undefined, { revalidate: true });
  mutate((key) => typeof key === "string" && key.startsWith(`collections-owner-${normalized}`), undefined, { revalidate: true });
}
