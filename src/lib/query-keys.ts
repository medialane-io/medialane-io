import type { ApiOrdersQuery } from "@medialane/sdk";

export const QUERY_PREFIX = {
  orders: "orders",
  order: "order",
  listings: "listings",
  userOrders: "user-orders",
  counterOffers: "counter-offers",
  floorListings: "floor-listings",
  token: "token",
  tokensOwned: "tokens-owned",
  tokenHistory: "token-history",
  collection: "collection",
  collections: "collections",
  collectionsOwner: "collections-owner",
  collectionTokens: "collection-tokens",
  userCollections: "user-collections",
  profileCollection: "profile-collection",
} as const;

function normalizePart(value: string | number | boolean | null | undefined) {
  return value == null ? "" : String(value);
}

export const queryKeys = {
  orders: (query: ApiOrdersQuery = {}) => JSON.stringify({ op: QUERY_PREFIX.orders, ...query }),
  order: (orderHash: string) => `${QUERY_PREFIX.order}-${orderHash}`,
  listings: (contract: string, tokenId: string) => `${QUERY_PREFIX.listings}-${contract}-${tokenId}`,
  userOrders: (address: string) => `${QUERY_PREFIX.userOrders}-${address}`,
  counterOffersByOrder: (orderHash: string) => `${QUERY_PREFIX.counterOffers}-${orderHash}`,
  counterOffersBySeller: (sellerAddress: string) => `${QUERY_PREFIX.counterOffers}-seller-${sellerAddress}`,
  floorListings: (contract: string, limit: number) => `${QUERY_PREFIX.floorListings}-${contract}-${limit}`,
  token: (contract: string, tokenId: string) => `${QUERY_PREFIX.token}-${contract}-${tokenId}`,
  tokensOwned: (address: string, page: number, limit: number) =>
    `${QUERY_PREFIX.tokensOwned}-${address}-${page}-${limit}`,
  tokenHistory: (contract: string, tokenId: string) =>
    `${QUERY_PREFIX.tokenHistory}-${contract}-${tokenId}`,
  collections: (
    page: number,
    limit: number,
    isFeatured: boolean | undefined,
    sort: string,
    hideEmpty: boolean,
    source?: string
  ) =>
    [
      QUERY_PREFIX.collections,
      page,
      limit,
      normalizePart(isFeatured),
      sort,
      hideEmpty,
      normalizePart(source),
    ].join("-"),
  collection: (contract: string) => `${QUERY_PREFIX.collection}-${contract}`,
  collectionsOwner: (owner: string) => `${QUERY_PREFIX.collectionsOwner}-${owner}`,
  collectionTokens: (contract: string, page: number, limit: number) =>
    `${QUERY_PREFIX.collectionTokens}-${contract}-${page}-${limit}`,
  userCollections: (address: string) => `${QUERY_PREFIX.userCollections}-${address}`,
};

export function queryKeyPrefix(prefix: (typeof QUERY_PREFIX)[keyof typeof QUERY_PREFIX]) {
  return `${prefix}-`;
}
