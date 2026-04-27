import { mutate } from "swr";
import { queryKeyPrefix, QUERY_PREFIX, queryKeys } from "./query-keys";

/**
 * Immediately invalidates SWR caches for both owned tokens and user collections
 * for the given wallet address. Call this after a successful mint or collection
 * creation so the portfolio reflects the new state without waiting for the
 * next auto-refresh cycle.
 */
export function invalidatePortfolioCache(address: string) {
  mutate((key) => typeof key === "string" && key.startsWith(`${queryKeyPrefix(QUERY_PREFIX.tokensOwned)}${address}-`), undefined, { revalidate: true });
  mutate((key) => typeof key === "string" && key.startsWith(queryKeys.collectionsOwner(address)), undefined, { revalidate: true });
}
