import { MedialaneClient } from "@medialane/sdk/starknet";
import {
  MEDIALANE_BACKEND_URL,
  MEDIALANE_API_KEY,
  STARKNET_RPC_URL,
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
 */
let _client: MedialaneClient | null = null;

export function getMedialaneClient(): MedialaneClient {
  if (!_client) {
    _client = new MedialaneClient({
      backendUrl: MEDIALANE_BACKEND_URL,
      apiKey: MEDIALANE_API_KEY || undefined,
      rpcUrl: STARKNET_RPC_URL,
      marketplaceContract: STARKNET_MARKETPLACE_721_CONTRACT,
      marketplace1155Contract: STARKNET_MARKETPLACE_1155_CONTRACT,
      collectionContract: STARKNET_COLLECTION_721_CONTRACT,
      collection1155Contract: STARKNET_COLLECTION_1155_CONTRACT,
      chain: "STARKNET",
    });
  }
  return _client;
}
