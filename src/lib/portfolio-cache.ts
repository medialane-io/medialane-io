import { mutate } from "swr";
import { queryKeyPrefix, QUERY_PREFIX, queryKeys } from "./query-keys";

export function invalidatePortfolioCache(address: string) {
  mutate((key) => typeof key === "string" && key.startsWith(`${queryKeyPrefix(QUERY_PREFIX.tokensOwned)}${address}-`), undefined, { revalidate: true });
  mutate((key) => typeof key === "string" && key.startsWith(queryKeys.collectionsOwner(address)), undefined, { revalidate: true });
}
