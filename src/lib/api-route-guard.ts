import type { NextRequest } from "next/server";

/**
 * Same-origin + per-IP rate-limit guard for server-only API routes that have
 * no session to gate on (wallet-native has no server session — see
 * `/api/rpc/route.ts`, the original of this pattern). Every route that
 * forwards to a paid/credited upstream (AVNU paymaster, AVNU swap, Alchemy
 * RPC) needs this: request-body billing alone still lets an unauthenticated
 * script spam the route and burn this app's credit balance, since billing
 * happens before the upstream call regardless of whether the caller can ever
 * produce a valid signature to complete anything.
 */

/**
 * Blocks browser cross-origin abuse (which always carries an Origin header)
 * without breaking same-origin calls that omit it. Returns false only when
 * an Origin is present AND its host differs from the request host.
 */
export function isSameOrigin(req: NextRequest): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return true; // no Origin (SSR / non-CORS) → allow
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

/**
 * Per-process, per-IP rate limiter (Vercel lambdas don't share memory —
 * acceptable for cost-drain protection, not correctness, same tradeoff as
 * `/api/rpc/route.ts`). One instance per named route so limits don't bleed
 * across unrelated endpoints.
 */
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
