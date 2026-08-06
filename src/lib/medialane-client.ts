import { MedialaneClient } from "@medialane/sdk/starknet";
import { PUBLIC_RPC_FALLBACKS } from "@medialane/sdk";
import {
  MEDIALANE_BACKEND_URL,
  MEDIALANE_API_KEY,
  RPC_MAIN_URL,
  RPC_FALLBACK_URL,
  STARKNET_MARKETPLACE_721_CONTRACT,
  STARKNET_MARKETPLACE_1155_CONTRACT,
  STARKNET_COLLECTION_721_CONTRACT,
  STARKNET_COLLECTION_1155_CONTRACT,
} from "./constants";

/**
 * SDK client. The constants are already environment-aware:
 * - Server-side: real backend URL + real API key.
 * - Browser: `/api/proxy` (same-origin BFF) + empty key (the proxy adds it).
 *
 * Replaces the legacy `NEXT_PUBLIC_MEDIALANE_API_KEY` pattern that
 * shipped the key in the JS bundle.
 *
 * `rpcUrl` gets the same care: the SDK builds its own `RpcProvider` from it
 * for on-chain reads (creator-coin price, club/ticket/sponsorship checks —
 * see @medialane/sdk/src/starknet/services/*.ts) that run directly from
 * client hooks. Server-side, use the real keyed endpoint. In the browser,
 * use ONLY the SDK's keyless public fallback list — never `/api/rpc` (that
 * proxy is same-origin-guarded and rate limited, meant for this app's own
 * traffic, not anonymous discovery reads — see `publicReadProvider` in
 * `starknet.ts`) and never a NEXT_PUBLIC_* var that might carry a keyed URL.
 */
let _client: MedialaneClient | null = null;

export function medialaneConfig() {
  const rpcUrl = typeof window === "undefined"
    ? RPC_MAIN_URL || RPC_FALLBACK_URL
    : PUBLIC_RPC_FALLBACKS[0];
  return {
    backendUrl: MEDIALANE_BACKEND_URL,
    apiKey: MEDIALANE_API_KEY || undefined,
    rpcUrl,
    marketplaceContract: STARKNET_MARKETPLACE_721_CONTRACT,
    marketplace1155Contract: STARKNET_MARKETPLACE_1155_CONTRACT,
    collectionContract: STARKNET_COLLECTION_721_CONTRACT,
    collection1155Contract: STARKNET_COLLECTION_1155_CONTRACT,
    chain: "STARKNET" as const,
  };
}

export function getMedialaneClient(): MedialaneClient {
  if (!_client) _client = new MedialaneClient(medialaneConfig());
  return _client;
}
