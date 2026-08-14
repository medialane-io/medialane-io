import { RpcProvider } from "starknet";
import { createFailoverFetch, PUBLIC_RPC_FALLBACKS } from "@medialane/sdk";
import { getNetworkConfig } from "./networks";

export function walletProvider(rpc?: string): RpcProvider {
  const nodeUrl = rpc ?? getNetworkConfig().rpcUrl;
  return new RpcProvider({
    nodeUrl,
    baseFetch: createFailoverFetch([nodeUrl, ...PUBLIC_RPC_FALLBACKS]),
  });
}
