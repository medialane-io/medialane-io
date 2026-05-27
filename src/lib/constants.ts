import {
  MARKETPLACE_721_CONTRACT_MAINNET,
  MARKETPLACE_1155_CONTRACT_MAINNET,
  COLLECTION_721_CONTRACT_MAINNET,
  COLLECTION_1155_CONTRACT_MAINNET,
  NFTCOMMENTS_CONTRACT_MAINNET,
  SUPPORTED_TOKENS,
} from "@medialane/sdk";
import { readAddressEnv, readOptionalAddressEnv, readStringEnv } from "./env";

export { SUPPORTED_TOKENS };

export const MARKETPLACE_721_CONTRACT =
  readAddressEnv(
    process.env.NEXT_PUBLIC_MARKETPLACE_721_CONTRACT_MAINNET,
    MARKETPLACE_721_CONTRACT_MAINNET,
    "NEXT_PUBLIC_MARKETPLACE_721_CONTRACT_MAINNET"
  );

export const MARKETPLACE_1155_CONTRACT =
  readAddressEnv(
    process.env.NEXT_PUBLIC_MARKETPLACE_1155_CONTRACT_MAINNET,
    MARKETPLACE_1155_CONTRACT_MAINNET,
    "NEXT_PUBLIC_MARKETPLACE_1155_CONTRACT_MAINNET"
  );

export const COLLECTION_721_CONTRACT =
  readAddressEnv(
    process.env.NEXT_PUBLIC_COLLECTION_721_CONTRACT_MAINNET,
    COLLECTION_721_CONTRACT_MAINNET,
    "NEXT_PUBLIC_COLLECTION_721_CONTRACT_MAINNET"
  );

export const COLLECTION_1155_CONTRACT =
  readAddressEnv(
    process.env.NEXT_PUBLIC_COLLECTION_1155_CONTRACT_MAINNET,
    COLLECTION_1155_CONTRACT_MAINNET,
    "NEXT_PUBLIC_COLLECTION_1155_CONTRACT_MAINNET"
  );

export const STARKNET_RPC_URL =
  readStringEnv(process.env.NEXT_PUBLIC_STARKNET_RPC_URL);

/**
 * `MEDIALANE_BACKEND_URL` is **environment-aware**:
 *
 * - **Server-side** (RSC, BFF routes, sitemap): the real backend URL.
 *   Paired with `MEDIALANE_API_KEY` below (which holds the real server-only
 *   key on this side), so existing `${MEDIALANE_BACKEND_URL}/v1/...` + the
 *   `x-api-key: MEDIALANE_API_KEY` header pattern works unchanged.
 *
 * - **Browser**: `/api/proxy` — same-origin BFF that injects the real API
 *   key server-side (see `src/app/api/proxy/v1/[...path]/route.ts`).
 *   `MEDIALANE_API_KEY` is the empty string here, so any
 *   `x-api-key: MEDIALANE_API_KEY` header the client sends is harmless;
 *   the proxy strips and replaces it.
 *
 * The result: the legacy `NEXT_PUBLIC_MEDIALANE_API_KEY` pattern (which
 * shipped the key in the JS bundle) is gone, but existing call sites that
 * import these constants need no code changes.
 */
const isServer = typeof window === "undefined";

// On the client, target the same-origin BFF proxy. We use an absolute URL
// (origin + path) rather than a bare path because `MedialaneClient`'s Zod
// schema validates `backendUrl` with `z.string().url()` — `/api/proxy`
// alone is rejected as not a URL. fetch() against the absolute same-origin
// URL works identically to a relative one in the browser.
export const MEDIALANE_BACKEND_URL = isServer
  ? readStringEnv(process.env.NEXT_PUBLIC_MEDIALANE_BACKEND_URL, "http://localhost:3001")
  : `${window.location.origin}/api/proxy`;

export const MEDIALANE_API_KEY = isServer
  ? readStringEnv(process.env.MEDIALANE_API_KEY)
  : "";

// Regression guard: if a future refactor accidentally renames the env var to
// `NEXT_PUBLIC_MEDIALANE_API_KEY` (the exact bug the BFF proxy replaced), or
// otherwise causes a non-empty key to materialize in the browser bundle, fail
// loudly at module init rather than silently leaking. The check runs only in
// the browser — server-side the key is supposed to be set.
if (!isServer && MEDIALANE_API_KEY) {
  throw new Error(
    "MEDIALANE_API_KEY is non-empty in the browser bundle — the server-only " +
    "secret may be leaking. Check that no env var with a NEXT_PUBLIC_ prefix " +
    "carries the tenant API key, and that the isServer branch above is intact."
  );
}

export const PINATA_GATEWAY =
  readStringEnv(process.env.NEXT_PUBLIC_PINATA_GATEWAY, "https://gateway.pinata.cloud");

export const EXPLORER_URL =
  readStringEnv(process.env.NEXT_PUBLIC_EXPLORER_URL, "https://voyager.online");

export const MINT_CONTRACT =
  readOptionalAddressEnv(process.env.NEXT_PUBLIC_MINT_CONTRACT, "NEXT_PUBLIC_MINT_CONTRACT");

export const COMMENTS_CONTRACT =
  readAddressEnv(
    process.env.NEXT_PUBLIC_COMMENTS_CONTRACT,
    NFTCOMMENTS_CONTRACT_MAINNET,
    "NEXT_PUBLIC_COMMENTS_CONTRACT"
  );

// Genesis launch mint (alias kept for env compat)
export const LAUNCH_MINT_CONTRACT =
  readOptionalAddressEnv(
    process.env.NEXT_PUBLIC_LAUNCH_MINT_CONTRACT,
    "NEXT_PUBLIC_LAUNCH_MINT_CONTRACT"
  );

export const GENESIS_NFT_URI =
  readStringEnv(process.env.NEXT_PUBLIC_GENESIS_NFT_URI);

/** Optional: direct image URL shown in the NFT card preview (e.g. Pinata gateway URL). */
export const GENESIS_NFT_IMAGE_URL =
  readStringEnv(process.env.NEXT_PUBLIC_GENESIS_NFT_IMAGE_URL);

// Brazil event exclusive mint
export const BR_MINT_CONTRACT =
  readOptionalAddressEnv(process.env.NEXT_PUBLIC_BR_MINT_CONTRACT, "NEXT_PUBLIC_BR_MINT_CONTRACT");

export const BR_NFT_URI =
  readStringEnv(process.env.NEXT_PUBLIC_BR_NFT_URI);

// Global airdrop campaign (/mint)
export const MINT_NFT_URI =
  readStringEnv(process.env.NEXT_PUBLIC_MINT_NFT_URI);

export const MINT_NFT_IMAGE_URL =
  readStringEnv(process.env.NEXT_PUBLIC_MINT_NFT_IMAGE_URL);

export const DROP_FACTORY_CONTRACT =
  readAddressEnv(
    process.env.NEXT_PUBLIC_DROP_FACTORY_CONTRACT,
    "0x03587f42e29daee1b193f6cf83bf8627908ed6632d0d83fcb26225c50547d800",
    "NEXT_PUBLIC_DROP_FACTORY_CONTRACT"
  );

export const POP_FACTORY_CONTRACT =
  readAddressEnv(
    process.env.NEXT_PUBLIC_POP_FACTORY_CONTRACT,
    "0x00b32c34b427d8f346b5843ada6a37bd3368d879fc752cd52b68a87287f60111",
    "NEXT_PUBLIC_POP_FACTORY_CONTRACT"
  );

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
