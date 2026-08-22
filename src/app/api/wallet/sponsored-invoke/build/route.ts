import { NextRequest } from "next/server";
import { createBackendProxyHandler, createRateLimiter } from "@medialane/sdk";
import { MEDIALANE_BACKEND_URL, MEDIALANE_API_KEY } from "@/lib/constants";

export const runtime = "nodejs";

const handler = createBackendProxyHandler({
  path: "/v1/paymaster/invoke/build",
  backendUrl: MEDIALANE_BACKEND_URL,
  apiKey: MEDIALANE_API_KEY,
  checkRateLimit: createRateLimiter(60_000, 30),
});

export async function POST(req: NextRequest) {
  return handler(req);
}
