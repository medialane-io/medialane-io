export type OrderStatus = "ACTIVE" | "FULFILLED" | "CANCELLED" | "EXPIRED";
export type SortOrder = "price_asc" | "price_desc" | "recent";
export type ActivityType = "transfer" | "sale" | "listing" | "offer" | "cancelled";
export type IntentType = "CREATE_LISTING" | "MAKE_OFFER" | "FULFILL_ORDER" | "CANCEL_ORDER" | "MINT" | "CREATE_COLLECTION";
export type IntentStatus = "PENDING" | "SIGNED" | "SUBMITTED" | "CONFIRMED" | "FAILED" | "EXPIRED";
export type WebhookEventType = "ORDER_CREATED" | "ORDER_FULFILLED" | "ORDER_CANCELLED" | "TRANSFER";
export type WebhookStatus = "ACTIVE" | "DISABLED";
export type ApiKeyStatus = "ACTIVE" | "REVOKED";
export type TenantPlan = "FREE" | "PREMIUM";

// ─── Shared ───────────────────────────────────────────────────────────────────

export interface ApiMeta {
  page: number;
  limit: number;
  total?: number;
}

export interface ApiResponse<T> {
  data: T;
  meta?: ApiMeta;
}

// ─── Orders ───────────────────────────────────────────────────────────────────

export interface ApiOrdersQuery {
  status?: OrderStatus;
  collection?: string;
  currency?: string;
  sort?: SortOrder;
  page?: number;
  limit?: number;
  offerer?: string;
}

export interface ApiOrderOffer {
  itemType: string;
  token: string;
  identifier: string;
  startAmount: string;
  endAmount: string;
}

export interface ApiOrderConsideration extends ApiOrderOffer {
  recipient: string;
}

export interface ApiOrderPrice {
  raw: string | null;
  formatted: string | null;
  currency: string | null;
}

export interface ApiOrderTxHash {
  created: string | null;
  fulfilled: string | null;
  cancelled: string | null;
}

export interface ApiOrder {
  id: string;
  chain: string;
  orderHash: string;
  offerer: string;
  offer: ApiOrderOffer;
  consideration: ApiOrderConsideration;
  startTime: string;
  endTime: string;
  status: OrderStatus;
  fulfiller: string | null;
  nftContract: string | null;
  nftTokenId: string | null;
  price: ApiOrderPrice;
  txHash: ApiOrderTxHash;
  createdBlockNumber: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Tokens ───────────────────────────────────────────────────────────────────

export interface ApiTokenMetadata {
  name: string | null;
  description: string | null;
  image: string | null;
  attributes: unknown | null;
  ipType: string | null;
  licenseType: string | null;
  commercialUse: boolean | null;
  author: string | null;
}

export interface ApiToken {
  id: string;
  chain: string;
  contractAddress: string;
  tokenId: string;
  owner: string;
  tokenUri: string | null;
  metadataStatus: "PENDING" | "FETCHING" | "FETCHED" | "FAILED";
  metadata: ApiTokenMetadata;
  activeOrders: ApiOrder[];
  createdAt: string;
  updatedAt: string;
}

// ─── Collections ──────────────────────────────────────────────────────────────

export interface ApiCollection {
  id: string;
  chain: string;
  contractAddress: string;
  name: string | null;
  startBlock: string;
  isKnown: boolean;
  floorPrice: string | null;
  totalVolume: string | null;
  holderCount: number | null;
  totalSupply: number | null;
  createdAt: string;
  updatedAt: string;
}

// ─── Activities ───────────────────────────────────────────────────────────────

export interface ApiActivityPrice {
  raw: string | null;
  formatted: string | null;
  currency: string | null;
}

export interface ApiActivity {
  type: ActivityType;
  // Transfer fields
  contractAddress?: string;
  tokenId?: string;
  from?: string;
  to?: string;
  blockNumber?: string;
  // Order fields
  orderHash?: string;
  nftContract?: string;
  nftTokenId?: string;
  offerer?: string;
  fulfiller?: string | null;
  price?: ApiActivityPrice;
  txHash: string | null;
  timestamp: string;
}

export interface ApiActivitiesQuery {
  type?: ActivityType;
  page?: number;
  limit?: number;
}

// ─── Search ───────────────────────────────────────────────────────────────────

export interface ApiSearchTokenResult {
  contractAddress: string;
  tokenId: string;
  name: string | null;
  image: string | null;
  owner: string;
  metadataStatus: string;
}

export interface ApiSearchCollectionResult {
  contractAddress: string;
  name: string | null;
  totalSupply: number | null;
  floorPrice: string | null;
  holderCount: number | null;
}

export interface ApiSearchResult {
  tokens: ApiSearchTokenResult[];
  collections: ApiSearchCollectionResult[];
}

// ─── Intents ──────────────────────────────────────────────────────────────────

export interface ApiIntent {
  id: string;
  chain: string;
  type: IntentType;
  status: IntentStatus;
  requester: string;
  typedData: unknown;
  calls: unknown;
  signature: string[];
  txHash: string | null;
  orderHash: string | null;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiIntentCreated {
  id: string;
  typedData: unknown;
  calls: unknown;
  expiresAt: string;
}

export interface CreateListingIntentParams {
  offerer: string;
  nftContract: string;
  tokenId: string;
  currency: string;
  price: string;
  endTime: number;
  salt?: string;
}

export interface MakeOfferIntentParams {
  offerer: string;
  nftContract: string;
  tokenId: string;
  currency: string;
  price: string;
  endTime: number;
  salt?: string;
}

export interface FulfillOrderIntentParams {
  fulfiller: string;
  orderHash: string;
}

export interface CancelOrderIntentParams {
  offerer: string;
  orderHash: string;
}

export interface CreateMintIntentParams {
  /** Collection owner wallet address — must be the collection owner on-chain */
  owner: string;
  collectionId: string;
  recipient: string;
  tokenUri: string;
  /** Optional: override the default collection contract address */
  collectionContract?: string;
}

export interface CreateCollectionIntentParams {
  owner: string;
  name: string;
  symbol: string;
  baseUri: string;
  /** Optional: override the default collection contract address */
  collectionContract?: string;
}

// ─── Metadata ─────────────────────────────────────────────────────────────────

export interface ApiMetadataSignedUrl {
  url: string;
}

export interface ApiMetadataUpload {
  cid: string;
  url: string;
}

// ─── Portal (tenant self-service) ─────────────────────────────────────────────

export interface ApiPortalMe {
  id: string;
  name: string;
  email: string;
  plan: TenantPlan;
  status: string;
}

export interface ApiPortalKey {
  id: string;
  prefix: string;
  label: string;
  status: ApiKeyStatus;
  lastUsedAt: string | null;
  createdAt: string;
}

export interface ApiPortalKeyCreated {
  id: string;
  prefix: string;
  label: string | null;
  /** Plaintext key — shown ONCE at creation */
  plaintext: string;
}

export interface ApiUsageDay {
  day: string;
  requests: number;
}

export interface ApiWebhookEndpoint {
  id: string;
  url: string;
  events: WebhookEventType[];
  status: WebhookStatus;
  createdAt: string;
}

export interface ApiWebhookCreated extends ApiWebhookEndpoint {
  /** Signing secret — shown ONCE at creation, not stored in plaintext */
  secret: string;
}

export interface CreateWebhookParams {
  url: string;
  events: WebhookEventType[];
  label?: string;
}
