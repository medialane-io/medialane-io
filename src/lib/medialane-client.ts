import { MedialaneClient } from "@medialane/sdk";
import { MEDIALANE_BACKEND_URL, STARKNET_RPC_URL, MARKETPLACE_CONTRACT } from "./constants";

let _client: MedialaneClient | null = null;

export function getMedialaneClient(): MedialaneClient {
  if (!_client) {
    _client = new MedialaneClient({
      backendUrl: MEDIALANE_BACKEND_URL,
      rpcUrl: STARKNET_RPC_URL,
      marketplaceContract: MARKETPLACE_CONTRACT,
      network: "mainnet",
    });
  }
  return _client;
}
