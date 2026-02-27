/**
 * Temporary local stub for @medialane/sdk.
 * Used on the deploy/launch-mint branch while the real SDK package is built.
 * Mapped via tsconfig paths: "@medialane/sdk" → this file.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type OrderStatus = "ACTIVE" | "FULFILLED" | "CANCELLED" | "EXPIRED";

export interface ApiOrderPrice {
  raw: string;
  formatted: string;
  currency: string;
  decimals: number;
}

export interface ApiOrderItem {
  itemType: string;
  token: string;
  identifierOrCriteria: string;
  startAmount: string;
  endAmount: string;
}

export interface ApiOrderConsideration extends ApiOrderItem {
  recipient: string;
}

export interface ApiOrder {
  orderHash: string;
  offerer: string;
  nftContract: string;
  nftTokenId: string;
  offer: ApiOrderItem;
  consideration: ApiOrderConsideration;
  price: ApiOrderPrice;
  startTime: number;
  endTime: number;
  salt: string;
  nonce: string;
  status: OrderStatus;
  txHash: { created: string; fulfilled?: string; cancelled?: string };
  createdAt: string;
  updatedAt: string;
}

export interface ApiTokenMetadata {
  name?: string;
  description?: string;
  image?: string;
  ipType?: string;
  attributes?: Array<{ trait_type: string; value: string }>;
  [key: string]: unknown;
}

export interface ApiToken {
  contractAddress: string;
  tokenId: string;
  owner: string;
  tokenUri?: string;
  metadata?: ApiTokenMetadata;
  activeOrders?: ApiOrder[];
  createdAt: string;
}

export interface ApiCollection {
  contractAddress: string;
  name?: string;
  symbol?: string;
  description?: string;
  image?: string;
  totalSupply?: number;
  owner?: string;
  createdAt: string;
}

export interface ApiOrdersQuery {
  page?: number;
  limit?: number;
  status?: OrderStatus;
  offerer?: string;
  nftContract?: string;
  nftTokenId?: string;
}

export interface ApiResponseMeta {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface ApiResponse<T> {
  data: T;
  meta?: ApiResponseMeta;
}

// ─── Constants ────────────────────────────────────────────────────────────────

export const MARKETPLACE_CONTRACT_MAINNET =
  "0x0" as `0x${string}`;

export const COLLECTION_CONTRACT_MAINNET =
  "0x0" as `0x${string}`;

export const SUPPORTED_TOKENS = [
  {
    symbol: "STRK",
    address: "0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d",
    decimals: 18,
    name: "Starknet Token",
  },
  {
    symbol: "ETH",
    address: "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7",
    decimals: 18,
    name: "Ether",
  },
  {
    symbol: "USDC",
    address: "0x053c91253bc9682c04929ca02ed00b3e423f6710d2ee7e0d5ebb06f3ecf368a8",
    decimals: 6,
    name: "USD Coin",
  },
  {
    symbol: "USDT",
    address: "0x068f5c6a61780768455de69077e07e89787839bf8166decfbf92b645209c0fb8",
    decimals: 6,
    name: "Tether USD",
  },
] as const;

// ─── Client ───────────────────────────────────────────────────────────────────

interface MedialaneClientConfig {
  backendUrl: string;
  rpcUrl: string;
  marketplaceContract: string;
  network?: string;
}

class StubIndexer {
  async getOrders(_query?: ApiOrdersQuery): Promise<ApiResponse<ApiOrder[]>> {
    return { data: [] };
  }
  async getOrder(_hash: string): Promise<ApiResponse<ApiOrder | null>> {
    return { data: null };
  }
  async getListingsForToken(_contract: string, _tokenId: string): Promise<ApiResponse<ApiOrder[]>> {
    return { data: [] };
  }
  async getOrdersByUser(_address: string): Promise<ApiResponse<ApiOrder[]>> {
    return { data: [] };
  }
  async getToken(_contract: string, _tokenId: string): Promise<ApiResponse<ApiToken | null>> {
    return { data: null };
  }
  async getTokensByOwner(
    _address: string,
    _page?: number,
    _limit?: number
  ): Promise<ApiResponse<ApiToken[]>> {
    return { data: [] };
  }
  async getCollections(_page?: number, _limit?: number): Promise<ApiResponse<ApiCollection[]>> {
    return { data: [] };
  }
  async getCollection(_contract: string): Promise<ApiResponse<ApiCollection | null>> {
    return { data: null };
  }
}

export class MedialaneClient {
  readonly indexer: StubIndexer;

  constructor(_config: MedialaneClientConfig) {
    this.indexer = new StubIndexer();
  }
}

// ─── SNIP-12 typed data builders (stubs) ─────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function buildOrderTypedData(_params: any, _chainId: string): any {
  throw new Error("Marketplace not available yet");
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function buildFulfillmentTypedData(_params: any, _chainId: string): any {
  throw new Error("Marketplace not available yet");
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function buildCancellationTypedData(_params: any, _chainId: string): any {
  throw new Error("Marketplace not available yet");
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function stringifyBigInts(obj: any): any {
  if (typeof obj === "bigint") return obj.toString();
  if (Array.isArray(obj)) return obj.map(stringifyBigInts);
  if (obj !== null && typeof obj === "object") {
    return Object.fromEntries(
      Object.entries(obj).map(([k, v]) => [k, stringifyBigInts(v)])
    );
  }
  return obj;
}
