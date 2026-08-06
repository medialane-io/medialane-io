import { RpcProvider } from "starknet";
import { createFailoverFetch, PUBLIC_RPC_FALLBACKS } from "@medialane/sdk";
import { getNetworkConfig } from "./networks";

/**
 * The one place an `RpcProvider` gets constructed for the wallet module.
 * Fails over across the SDK's public endpoint list on transient errors —
 * same resilience pattern as the rest of io's client-side RPC usage
 * (`src/lib/starknet.ts`), applied here so the wallet module has no
 * dependency on that file (which is scoped to the old ChipiPay executor and
 * is deleted in the Phase 7 removal step).
 */
export function walletProvider(rpc?: string): RpcProvider {
  const nodeUrl = rpc ?? getNetworkConfig().rpcUrl;
  return new RpcProvider({
    nodeUrl,
    baseFetch: createFailoverFetch([nodeUrl, ...PUBLIC_RPC_FALLBACKS]),
  });
}
