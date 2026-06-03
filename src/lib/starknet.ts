import { RpcProvider } from "starknet";
import { STARKNET_RPC_URL } from "./constants";

/**
 * Shared RpcProvider singleton — import this instead of creating new instances.
 *
 * Uses NEXT_PUBLIC_STARKNET_PROVIDER_URL when set (points to /api/rpc, a
 * server-side proxy that hides the Alchemy key, rotates through fallback
 * endpoints, and prevents browser-side CORS failures during waitForTransaction
 * polling). Falls back to NEXT_PUBLIC_STARKNET_RPC_URL for local dev / when the
 * proxy env is unset.
 */
const nodeUrl = process.env.NEXT_PUBLIC_STARKNET_PROVIDER_URL || STARKNET_RPC_URL;

/**
 * Public Starknet mainnet fallback (RPC spec 0.8.1, no API key, permissive
 * CORS). Defense-in-depth on top of the /api/rpc proxy: if the configured
 * endpoint returns a transient failure — Alchemy's intermittent HTTP 503 /
 * `-32001 "Unable to complete request"`, or the proxy exhausting its upstreams
 * (`-32603`) — we replay the request against lava.build so a single blip
 * doesn't stall a waitForTransaction poll loop. Reads only; deterministic
 * contract errors propagate verbatim.
 */
const FALLBACK_RPC_URL = "https://rpc.starknet.lava.build/";

function looksTransient(status: number, bodyText: string): boolean {
  if (status === 429 || status >= 500) return true;
  return /"code"\s*:\s*-32001|"code"\s*:\s*-32603|unable to complete|rate.?limit|too many|throttl|temporarily unavailable|service unavailable|overload|gateway.*time/i.test(
    bodyText,
  );
}

const failoverFetch: typeof fetch = async (input, init) => {
  const primaryUrl = typeof input === "string" ? input : nodeUrl;
  try {
    const res = await fetch(primaryUrl, init);
    const text = await res.text();
    if (!looksTransient(res.status, text)) {
      return new Response(text, {
        status: res.status,
        statusText: res.statusText,
        headers: res.headers,
      });
    }
  } catch {
    // Primary unreachable (network / CORS) — fall through to the fallback.
  }
  return fetch(FALLBACK_RPC_URL, init);
};

// blockIdentifier "latest" — the RPC endpoint rejects the "pending" block tag
// ("-32602: Invalid block id"). starknet.js defaults reads (e.g. the Account's
// cairo-version detection via getClassHashAt) to "pending"; force "latest".
export const starknetProvider = new RpcProvider({
  nodeUrl,
  blockIdentifier: "latest",
  baseFetch: failoverFetch,
});
