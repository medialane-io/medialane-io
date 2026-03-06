export interface OfferItem {
  item_type: string;
  token: string;
  identifier_or_criteria: string;
  start_amount: string;
  end_amount: string;
}

export interface ConsiderationItem extends OfferItem {
  recipient: string;
}

export interface OrderParameters {
  offerer: string;
  offer: OfferItem;
  consideration: ConsiderationItem;
  start_time: string;
  end_time: string;
  salt: string;
  nonce: string;
}

export interface Order {
  parameters: OrderParameters;
  signature: string[];
}

export interface Fulfillment {
  order_hash: string;
  fulfiller: string;
  nonce: string;
}

export interface Cancelation {
  order_hash: string;
  offerer: string;
  nonce: string;
}

// SDK-level param types for the public API

export interface CreateListingParams {
  nftContract: string;
  tokenId: string;
  price: string;
  /** Currency symbol or token address. Defaults to "USDC" (native). */
  currency?: string;
  durationSeconds: number;
}

export interface MakeOfferParams {
  nftContract: string;
  tokenId: string;
  price: string;
  /** Currency symbol or token address. Defaults to "USDC" (native). */
  currency?: string;
  durationSeconds: number;
}

export interface FulfillOrderParams {
  orderHash: string;
}

export interface CancelOrderParams {
  orderHash: string;
}

export interface CartItem {
  orderHash: string;
  /** ERC20 token address of the consideration */
  considerationToken: string;
  /** Raw consideration amount (string, e.g. "1000000") */
  considerationAmount: string;
  /** Human-readable identifier for the NFT (for logging) */
  offerIdentifier?: string;
}

export interface MintParams {
  collectionId: string;
  recipient: string;
  tokenUri: string;
  /** Optional: override the collection contract from config */
  collectionContract?: string;
}

export interface CreateCollectionParams {
  name: string;
  symbol: string;
  baseUri: string;
  /** Optional: override the collection contract from config */
  collectionContract?: string;
}

export interface TxResult {
  txHash: string;
}
