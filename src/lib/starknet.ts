import { RpcProvider } from "starknet";
import { createFailoverFetch, PUBLIC_RPC_FALLBACKS } from "@medialane/sdk";
import { STARKNET_RPC_URL } from "./constants";

const PRIMARY = process.env.NEXT_PUBLIC_STARKNET_PROVIDER_URL || STARKNET_RPC_URL;
const RPC_URLS = Array.from(new Set([PRIMARY, ...PUBLIC_RPC_FALLBACKS].filter(Boolean)));

export const starknetProvider = new RpcProvider({
  nodeUrl: RPC_URLS[0],
  blockIdentifier: "latest",
  baseFetch: createFailoverFetch(RPC_URLS),
});

export const publicReadProvider = new RpcProvider({
  nodeUrl: PUBLIC_RPC_FALLBACKS[0],
  blockIdentifier: "latest",
  baseFetch: createFailoverFetch([...PUBLIC_RPC_FALLBACKS]),
});
