import {
  MARKETPLACE_CONTRACT_MAINNET,
  COLLECTION_CONTRACT_MAINNET,
  SUPPORTED_TOKENS,
} from "@medialane/sdk";

export { SUPPORTED_TOKENS };

export const MARKETPLACE_CONTRACT =
  (process.env.NEXT_PUBLIC_MARKETPLACE_CONTRACT as `0x${string}`) ||
  MARKETPLACE_CONTRACT_MAINNET;

export const COLLECTION_CONTRACT =
  (process.env.NEXT_PUBLIC_COLLECTION_CONTRACT as `0x${string}`) ||
  COLLECTION_CONTRACT_MAINNET;

export const STARKNET_RPC_URL =
  process.env.NEXT_PUBLIC_STARKNET_RPC_URL ||
  "https://starknet-mainnet.g.alchemy.com/starknet/version/rpc/v0_10/5Kaw8bJUF3QFKknr4N6Uo";

export const MEDIALANE_BACKEND_URL =
  process.env.NEXT_PUBLIC_MEDIALANE_BACKEND_URL || "http://localhost:3001";

export const PINATA_GATEWAY =
  process.env.NEXT_PUBLIC_PINATA_GATEWAY || "https://gateway.pinata.cloud";

export const EXPLORER_URL =
  process.env.NEXT_PUBLIC_EXPLORER_URL || "https://voyager.online";

export const MINT_CONTRACT =
  (process.env.NEXT_PUBLIC_MINT_CONTRACT as `0x${string}`) || ("" as `0x${string}`);

// Genesis launch mint (alias kept for env compat)
export const LAUNCH_MINT_CONTRACT =
  (process.env.NEXT_PUBLIC_LAUNCH_MINT_CONTRACT as `0x${string}`) || ("" as `0x${string}`);

export const GENESIS_NFT_URI =
  process.env.NEXT_PUBLIC_GENESIS_NFT_URI || "";

/** Optional: direct image URL shown in the NFT card preview (e.g. Pinata gateway URL). */
export const GENESIS_NFT_IMAGE_URL =
  process.env.NEXT_PUBLIC_GENESIS_NFT_IMAGE_URL || "";

export const DURATION_OPTIONS = [
  { label: "1 Day", seconds: 86400 },
  { label: "7 Days", seconds: 604800 },
  { label: "30 Days", seconds: 2592000 },
  { label: "6 Months", seconds: 15552000 },
] as const;

export type SupportedCurrencySymbol = "STRK" | "USDC" | "USDT" | "ETH";
