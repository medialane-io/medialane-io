import { NextRequest } from "next/server";
import { PUBLIC_RPC_FALLBACKS, createRpcProxyHandler } from "@medialane/sdk";
import { MEDIALANE_BACKEND_URL, MEDIALANE_API_KEY } from "@/lib/constants";
import { createRateLimiter } from "@/lib/api-route-guard";

const RPC_URLS = Array.from(new Set([
  process.env.ALCHEMY_RPC_URL,
  process.env.ALCHEMY_URL,
  process.env.STARKNET_RPC_URL_SERVER,
  process.env.STARKNET_RPC_FALLBACK_URL,
  ...PUBLIC_RPC_FALLBACKS,
].filter((url): url is string => Boolean(url))));

const checkRateLimit = createRateLimiter(60_000, 600);

const handler = createRpcProxyHandler({
  rpcUrls: RPC_URLS,
  backendUrl: MEDIALANE_BACKEND_URL,
  apiKey: MEDIALANE_API_KEY,
  checkRateLimit,
});

export async function POST(req: NextRequest) {
  return handler(req);
}
