import {
  MARKETPLACE_CONTRACT_MAINNET as MARKETPLACE_721_CONTRACT_MAINNET,
  MARKETPLACE_1155_CONTRACT_MAINNET,
  COLLECTION_CONTRACT_MAINNET as COLLECTION_721_CONTRACT_MAINNET,
  NFTCOMMENTS_CONTRACT_MAINNET,
  SUPPORTED_TOKENS,
} from "@medialane/sdk";

export { SUPPORTED_TOKENS };

export const MARKETPLACE_721_CONTRACT =
  (process.env.NEXT_PUBLIC_MARKETPLACE_721_CONTRACT_MAINNET as `0x${string}`) ||
  MARKETPLACE_721_CONTRACT_MAINNET;

export const MARKETPLACE_1155_CONTRACT =
  (process.env.NEXT_PUBLIC_MARKETPLACE_1155_CONTRACT_MAINNET as `0x${string}`) ||
  MARKETPLACE_1155_CONTRACT_MAINNET;

export const COLLECTION_721_CONTRACT =
  (process.env.NEXT_PUBLIC_COLLECTION_721_CONTRACT_MAINNET as `0x${string}`) ||
  COLLECTION_721_CONTRACT_MAINNET;

export const STARKNET_RPC_URL =
  process.env.NEXT_PUBLIC_STARKNET_RPC_URL || "";

export const MEDIALANE_BACKEND_URL =
  process.env.NEXT_PUBLIC_MEDIALANE_BACKEND_URL || "http://localhost:3001";

// read-only public key — authorizes read operations only. Do NOT use for admin ops.
export const MEDIALANE_API_KEY =
  process.env.NEXT_PUBLIC_MEDIALANE_API_KEY || "";

export const PINATA_GATEWAY =
  process.env.NEXT_PUBLIC_PINATA_GATEWAY || "https://gateway.pinata.cloud";

export const EXPLORER_URL =
  process.env.NEXT_PUBLIC_EXPLORER_URL || "https://voyager.online";

export const MINT_CONTRACT =
  (process.env.NEXT_PUBLIC_MINT_CONTRACT as `0x${string}`) || ("" as `0x${string}`);

export const COMMENTS_CONTRACT =
  (process.env.NEXT_PUBLIC_COMMENTS_CONTRACT as `0x${string}`) ||
  NFTCOMMENTS_CONTRACT_MAINNET;

// Genesis launch mint (alias kept for env compat)
export const LAUNCH_MINT_CONTRACT =
  (process.env.NEXT_PUBLIC_LAUNCH_MINT_CONTRACT as `0x${string}`) || ("" as `0x${string}`);

export const GENESIS_NFT_URI =
  process.env.NEXT_PUBLIC_GENESIS_NFT_URI || "";

/** Optional: direct image URL shown in the NFT card preview (e.g. Pinata gateway URL). */
export const GENESIS_NFT_IMAGE_URL =
  process.env.NEXT_PUBLIC_GENESIS_NFT_IMAGE_URL || "";

// Brazil event exclusive mint
export const BR_MINT_CONTRACT =
  (process.env.NEXT_PUBLIC_BR_MINT_CONTRACT as `0x${string}`) || ("" as `0x${string}`);

export const BR_NFT_URI =
  process.env.NEXT_PUBLIC_BR_NFT_URI || "";

export const BR_NFT_IMAGE_URL =
  process.env.NEXT_PUBLIC_BR_NFT_IMAGE_URL || "";

// Global airdrop campaign (/mint)
export const MINT_NFT_URI =
  process.env.NEXT_PUBLIC_MINT_NFT_URI || "";

export const MINT_NFT_IMAGE_URL =
  process.env.NEXT_PUBLIC_MINT_NFT_IMAGE_URL || "";

export const DROP_FACTORY_CONTRACT =
  (process.env.NEXT_PUBLIC_DROP_FACTORY_CONTRACT as `0x${string}`) || ("" as `0x${string}`);

export const POP_FACTORY_CONTRACT =
  (process.env.NEXT_PUBLIC_POP_FACTORY_CONTRACT as `0x${string}`) || ("" as `0x${string}`);

/** Delay (ms) before re-fetching after a write op, allowing the indexer to process the block. */
export const INDEXER_REVALIDATION_DELAY_MS = 10_000;

export const DURATION_OPTIONS = [
  { label: "1 Day", seconds: 86400 },
  { label: "7 Days", seconds: 604800 },
  { label: "30 Days", seconds: 2592000 },
  { label: "6 Months", seconds: 15552000 },
  { label: "1 Year", seconds: 31536000 },
  { label: "2 Years", seconds: 63072000 },
] as const;
