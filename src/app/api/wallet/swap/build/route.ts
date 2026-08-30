import { NextRequest } from "next/server";
import { limiterFor } from "@/lib/rate-limit-policy";
import { createBackendProxyHandler } from "@medialane/sdk";
import { MEDIALANE_BACKEND_URL, MEDIALANE_API_KEY } from "@/lib/constants";

export const runtime = "nodejs";

const handler = createBackendProxyHandler({
  path: "/v1/swap/build",
  backendUrl: MEDIALANE_BACKEND_URL,
  apiKey: MEDIALANE_API_KEY,
  checkRateLimit: limiterFor("wallet:swap-build"),
});

export async function POST(req: NextRequest) {
  return handler(req);
}
