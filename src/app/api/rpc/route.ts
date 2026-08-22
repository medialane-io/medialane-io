import { NextRequest } from "next/server";
import { createRpcProxyHandler } from "@medialane/sdk";
import { MEDIALANE_BACKEND_URL, MEDIALANE_API_KEY, RPC_URLS } from "@/lib/constants";
import { createRateLimiter } from "@/lib/api-route-guard";

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
