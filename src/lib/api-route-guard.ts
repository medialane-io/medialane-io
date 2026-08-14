import type { NextRequest } from "next/server";

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

export function requestIp(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
}

export function createRateLimiter(windowMs: number, max: number) {
  const counts = new Map<string, { count: number; resetAt: number }>();
  return function checkRateLimit(ip: string): boolean {
    const now = Date.now();
    const entry = counts.get(ip);
    if (!entry || now >= entry.resetAt) {
      counts.set(ip, { count: 1, resetAt: now + windowMs });
      return true;
    }
    if (entry.count >= max) return false;
    entry.count += 1;
    return true;
  };
}
