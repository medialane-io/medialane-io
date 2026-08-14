import { RpcProvider } from "starknet";
import { createFailoverFetch } from "@medialane/sdk";
import { STARKNET_RPC_URL } from "./constants";

const PRIMARY = process.env.NEXT_PUBLIC_STARKNET_PROVIDER_URL || STARKNET_RPC_URL || "/api/rpc";

export const starknetProvider = new RpcProvider({
  nodeUrl: PRIMARY,
  blockIdentifier: "latest",
  baseFetch: createFailoverFetch([PRIMARY]),
});

export const publicReadProvider = starknetProvider;
