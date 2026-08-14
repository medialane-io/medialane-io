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
