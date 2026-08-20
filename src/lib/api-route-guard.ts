import type { NextRequest } from "next/server";

export { createRateLimiter, requestIp } from "@medialane/sdk";

export function isSameOrigin(req: NextRequest): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return true;
  const host = req.headers.get("host");
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}
