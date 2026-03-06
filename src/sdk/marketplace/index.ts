import { type AccountInterface, type TypedData, constants } from "starknet";
import type { ResolvedConfig } from "../config";
import type {
  CreateListingParams,
  MakeOfferParams,
  FulfillOrderParams,
  CancelOrderParams,
  CartItem,
  MintParams,
  CreateCollectionParams,
  TxResult,
} from "../types/marketplace";
import {
  buildOrderTypedData,
  buildFulfillmentTypedData,
  buildCancellationTypedData,
} from "./signing";
import {
  createListing,
  makeOffer,
  fulfillOrder,
  cancelOrder,
  checkoutCart,
  mint,
  createCollection,
} from "./orders";

export { MedialaneError } from "./orders";

export class MarketplaceModule {
  constructor(private readonly config: ResolvedConfig) {}

  // ─── Writes ───────────────────────────────────────────────────────────────

  createListing(account: AccountInterface, params: CreateListingParams): Promise<TxResult> {
    return createListing(account, params, this.config);
  }

  makeOffer(account: AccountInterface, params: MakeOfferParams): Promise<TxResult> {
    return makeOffer(account, params, this.config);
  }

  fulfillOrder(account: AccountInterface, params: FulfillOrderParams): Promise<TxResult> {
    return fulfillOrder(account, params, this.config);
  }

  cancelOrder(account: AccountInterface, params: CancelOrderParams): Promise<TxResult> {
    return cancelOrder(account, params, this.config);
  }

  checkoutCart(account: AccountInterface, items: CartItem[]): Promise<TxResult> {
    return checkoutCart(account, items, this.config);
  }

  mint(account: AccountInterface, params: MintParams): Promise<TxResult> {
    return mint(account, params, this.config);
  }

  createCollection(account: AccountInterface, params: CreateCollectionParams): Promise<TxResult> {
    return createCollection(account, params, this.config);
  }

  // ─── Typed data builders (for ChipiPay / custom signing flows) ───────────

  buildListingTypedData(
    params: Record<string, unknown>,
    chainId: constants.StarknetChainId
  ): TypedData {
    return buildOrderTypedData(params, chainId);
  }

  buildFulfillmentTypedData(
    params: Record<string, unknown>,
    chainId: constants.StarknetChainId
  ): TypedData {
    return buildFulfillmentTypedData(params, chainId);
  }

  buildCancellationTypedData(
    params: Record<string, unknown>,
    chainId: constants.StarknetChainId
  ): TypedData {
    return buildCancellationTypedData(params, chainId);
  }
}
