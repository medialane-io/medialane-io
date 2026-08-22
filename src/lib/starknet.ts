import { RpcProvider } from "starknet";
import { MEDIALANE_BACKEND_URL } from "./constants";

export const RPC_PRIMARY_URL =
  typeof window === "undefined"
    ? `${MEDIALANE_BACKEND_URL.replace(/\/$/, "")}/v1/rpc`
    : "/api/rpc";

export const starknetProvider = new RpcProvider({
  nodeUrl: RPC_PRIMARY_URL,
  blockIdentifier: "latest",
});
