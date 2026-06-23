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

/**
 * Public read-only provider — for PUBLIC pages that read on-chain data without a
 * signed-in user (e.g. /coins live Ekubo prices). It deliberately skips the
 * /api/rpc proxy: that proxy gates `starknet_call` behind a Clerk session
 * (returns `-32000 Unauthorized` to logged-out visitors), which is correct for
 * write/auth flows but wrong for anonymous discovery reads.
 *
 * It uses ONLY the SDK's keyless public fallback list (lava.build, blastapi,
 * nethermind) — never the Alchemy endpoint. The Alchemy URL carries our API key
 * and must stay server-side (it lives in ALCHEMY_RPC_URL, used only inside
 * /api/rpc); routing browser traffic through it would leak the key. We also skip
 * NEXT_PUBLIC_STARKNET_RPC_URL here so a misconfigured keyed value in that var
 * can never reach the browser via this provider. Reads only — never sign or send
 * a transaction through this.
 */
export const publicReadProvider = new RpcProvider({
  nodeUrl: PUBLIC_RPC_FALLBACKS[0],
  blockIdentifier: "latest",
  baseFetch: createFailoverFetch([...PUBLIC_RPC_FALLBACKS]),
});
