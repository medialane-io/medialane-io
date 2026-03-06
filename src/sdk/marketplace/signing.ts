import { type TypedData, TypedDataRevision, constants } from "starknet";

/**
 * Build SNIP-12 typed data for signing an OrderParameters struct.
 * Uses TypedDataRevision.ACTIVE and ContractAddress / shortstring SNIP-12 types.
 */
export function buildOrderTypedData(
  message: Record<string, unknown>,
  chainId: constants.StarknetChainId
): TypedData {
  return {
    domain: {
      name: "Medialane",
      version: "1",
      chainId,
      revision: TypedDataRevision.ACTIVE,
    },
    primaryType: "OrderParameters",
    types: {
      StarknetDomain: [
        { name: "name", type: "shortstring" },
        { name: "version", type: "shortstring" },
        { name: "chainId", type: "shortstring" },
        { name: "revision", type: "shortstring" },
      ],
      OrderParameters: [
        { name: "offerer", type: "ContractAddress" },
        { name: "offer", type: "OfferItem" },
        { name: "consideration", type: "ConsiderationItem" },
        { name: "start_time", type: "felt" },
        { name: "end_time", type: "felt" },
        { name: "salt", type: "felt" },
        { name: "nonce", type: "felt" },
      ],
      OfferItem: [
        { name: "item_type", type: "shortstring" },
        { name: "token", type: "ContractAddress" },
        { name: "identifier_or_criteria", type: "felt" },
        { name: "start_amount", type: "felt" },
        { name: "end_amount", type: "felt" },
      ],
      ConsiderationItem: [
        { name: "item_type", type: "shortstring" },
        { name: "token", type: "ContractAddress" },
        { name: "identifier_or_criteria", type: "felt" },
        { name: "start_amount", type: "felt" },
        { name: "end_amount", type: "felt" },
        { name: "recipient", type: "ContractAddress" },
      ],
    },
    message,
  };
}

/**
 * Build SNIP-12 typed data for signing an OrderFulfillment struct.
 */
export function buildFulfillmentTypedData(
  message: Record<string, unknown>,
  chainId: constants.StarknetChainId
): TypedData {
  return {
    domain: {
      name: "Medialane",
      version: "1",
      chainId,
      revision: TypedDataRevision.ACTIVE,
    },
    primaryType: "OrderFulfillment",
    types: {
      StarknetDomain: [
        { name: "name", type: "shortstring" },
        { name: "version", type: "shortstring" },
        { name: "chainId", type: "shortstring" },
        { name: "revision", type: "shortstring" },
      ],
      OrderFulfillment: [
        { name: "order_hash", type: "felt" },
        { name: "fulfiller", type: "ContractAddress" },
        { name: "nonce", type: "felt" },
      ],
    },
    message,
  };
}

/**
 * Build SNIP-12 typed data for signing an OrderCancellation struct.
 */
export function buildCancellationTypedData(
  message: Record<string, unknown>,
  chainId: constants.StarknetChainId
): TypedData {
  return {
    domain: {
      name: "Medialane",
      version: "1",
      chainId,
      revision: TypedDataRevision.ACTIVE,
    },
    primaryType: "OrderCancellation",
    types: {
      StarknetDomain: [
        { name: "name", type: "shortstring" },
        { name: "version", type: "shortstring" },
        { name: "chainId", type: "shortstring" },
        { name: "revision", type: "shortstring" },
      ],
      OrderCancellation: [
        { name: "order_hash", type: "felt" },
        { name: "offerer", type: "ContractAddress" },
        { name: "nonce", type: "felt" },
      ],
    },
    message,
  };
}
