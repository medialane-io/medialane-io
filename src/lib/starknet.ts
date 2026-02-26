import { RpcProvider } from "starknet";
import { STARKNET_RPC_URL } from "./constants";

/** Shared RpcProvider singleton — import this instead of creating new instances. */
export const starknetProvider = new RpcProvider({ nodeUrl: STARKNET_RPC_URL });
