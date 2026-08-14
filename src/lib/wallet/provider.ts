import { RpcProvider } from "starknet";
import { createFailoverFetch } from "@medialane/sdk";

export function walletProvider(rpc?: string): RpcProvider {
  const nodeUrl = rpc ?? "/api/rpc";
  return new RpcProvider({
    nodeUrl,
    baseFetch: createFailoverFetch([nodeUrl]),
  });
}
