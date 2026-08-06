import { PUBLIC_RPC_FALLBACKS } from "@medialane/sdk";

export interface NetworkConfig {
  label: string;
  short: string;
  rpcUrl: string;
  explorerBase: string;
}

const MAINNET: NetworkConfig = {
  label: "Starknet Mainnet",
  short: "Mainnet",
  // Keyless public endpoint — never the Clerk-gated /api/rpc proxy. This
  // module must work for a visitor who has never touched Clerk, since it's
  // the thing replacing Clerk.
  rpcUrl: PUBLIC_RPC_FALLBACKS[0],
  explorerBase: "https://voyager.online",
};

export function getNetworkConfig(): NetworkConfig {
  return MAINNET;
}
