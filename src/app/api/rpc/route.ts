import { NextRequest } from "next/server";
import { createRpcProxyHandler, createRateLimiter } from "@medialane/sdk";
import { MEDIALANE_BACKEND_URL, MEDIALANE_API_KEY } from "@/lib/constants";

const checkRateLimit = createRateLimiter(60_000, 600);

const handler = createRpcProxyHandler({
  backendUrl: MEDIALANE_BACKEND_URL,
  apiKey: MEDIALANE_API_KEY,
  checkRateLimit,
});

export async function POST(req: NextRequest) {
  return handler(req);
}
