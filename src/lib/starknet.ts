import { RpcProvider } from "starknet";
import { createFailoverFetch, PUBLIC_RPC_FALLBACKS } from "@medialane/sdk";
import { STARKNET_RPC_URL } from "./constants";

/**
 * Shared RpcProvider singleton — import this instead of creating new instances.
 *
 * Primary endpoint is NEXT_PUBLIC_STARKNET_PROVIDER_URL (points to /api/rpc, the
 * server-side proxy that hides the Alchemy key + rotates fallbacks), falling
 * back to NEXT_PUBLIC_STARKNET_RPC_URL for local dev / when the proxy env is
 * unset. On a transient failure (Alchemy's intermittent 503 / -32001) it
 * additionally fails over to the SDK's public fallback list (lava.build, …) —
 * the failover policy + list are owned by @medialane/sdk, shared across apps.
 */
const PRIMARY = process.env.NEXT_PUBLIC_STARKNET_PROVIDER_URL || STARKNET_RPC_URL;
const RPC_URLS = Array.from(new Set([PRIMARY, ...PUBLIC_RPC_FALLBACKS].filter(Boolean)));

// blockIdentifier "latest" — the RPC endpoint rejects the "pending" block tag
// ("-32602: Invalid block id"). starknet.js defaults reads (e.g. the Account's
// cairo-version detection via getClassHashAt) to "pending"; force "latest".
export const starknetProvider = new RpcProvider({
  nodeUrl: RPC_URLS[0],
  blockIdentifier: "latest",
  baseFetch: createFailoverFetch(RPC_URLS),
});
