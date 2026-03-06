import { z } from "zod";
import {
  SUPPORTED_NETWORKS,
  DEFAULT_RPC_URLS,
  MARKETPLACE_CONTRACT_MAINNET,
  COLLECTION_CONTRACT_MAINNET,
  type Network,
} from "./constants";

export const MedialaneConfigSchema = z.object({
  network: z.enum(SUPPORTED_NETWORKS).default("mainnet"),
  rpcUrl: z.string().url().optional(),
  backendUrl: z.string().url().optional(),
  /** API key for authenticated /v1/* backend endpoints */
  apiKey: z.string().optional(),
  marketplaceContract: z.string().optional(),
  collectionContract: z.string().optional(),
});

export type MedialaneConfig = z.input<typeof MedialaneConfigSchema>;

export interface ResolvedConfig {
  network: Network;
  rpcUrl: string;
  backendUrl: string | undefined;
  apiKey: string | undefined;
  marketplaceContract: string;
  collectionContract: string;
}

export function resolveConfig(raw: MedialaneConfig): ResolvedConfig {
  const parsed = MedialaneConfigSchema.parse(raw);
  return {
    network: parsed.network,
    rpcUrl: parsed.rpcUrl ?? DEFAULT_RPC_URLS[parsed.network],
    backendUrl: parsed.backendUrl,
    apiKey: parsed.apiKey,
    marketplaceContract: parsed.marketplaceContract ?? MARKETPLACE_CONTRACT_MAINNET,
    collectionContract: parsed.collectionContract ?? COLLECTION_CONTRACT_MAINNET,
  };
}
