// Main client
export { MedialaneClient } from "./client";

// Config
export { type MedialaneConfig, type ResolvedConfig, resolveConfig } from "./config";

// Modules
export { MarketplaceModule, MedialaneError } from "./marketplace/index";
export { ApiClient, MedialaneApiError } from "./api/client";

// Types
export * from "./types/index";

// Constants
export {
  MARKETPLACE_CONTRACT_MAINNET,
  COLLECTION_CONTRACT_MAINNET,
  SUPPORTED_TOKENS,
  SUPPORTED_NETWORKS,
  DEFAULT_RPC_URLS,
  type Network,
  type SupportedTokenSymbol,
} from "./constants";

// ABI
export { IPMarketplaceABI } from "./abis";

// Utils
export { normalizeAddress, shortenAddress } from "./utils/address";
export { parseAmount, formatAmount, getTokenByAddress, getTokenBySymbol } from "./utils/token";
export { stringifyBigInts, u256ToBigInt } from "./utils/bigint";

// Signing builders (for advanced / ChipiPay integrations)
export {
  buildOrderTypedData,
  buildFulfillmentTypedData,
  buildCancellationTypedData,
} from "./marketplace/signing";
