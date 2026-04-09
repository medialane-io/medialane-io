import { RpcProvider } from "starknet";
import { STARKNET_RPC_URL } from "./constants";

/**
 * Shared RpcProvider singleton — import this instead of creating new instances.
 *
 * Uses NEXT_PUBLIC_STARKNET_PROVIDER_URL when set (points to /api/rpc, a
 * server-side proxy that hides the Alchemy key and prevents browser-side
 * CORS failures on 429 responses during waitForTransaction polling).
 * Falls back to NEXT_PUBLIC_STARKNET_RPC_URL for local dev without the proxy.
 */
const nodeUrl = process.env.NEXT_PUBLIC_STARKNET_PROVIDER_URL || STARKNET_RPC_URL;
export const starknetProvider = new RpcProvider({ nodeUrl });
