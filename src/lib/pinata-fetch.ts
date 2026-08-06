"use client";

/**
 * Wraps a fetch RequestInit with an Authorization: Bearer header carrying a
 * SIWS token — mirrors medialane-starknet's `pinata-fetch.ts`. Every
 * `/api/pinata/*` route verifies this token server-side via
 * `getSiwsWallet()` (replaces the old Clerk session cookie).
 *
 *   const token = getValidToken() ?? (await signIn());
 *   const res = await fetch("/api/pinata/signed-url", withSiwsAuth(token, { method: "POST" }));
 */
export function withSiwsAuth(token: string | null, init?: RequestInit): RequestInit {
  if (!token) return init ?? {};
  return {
    ...init,
    headers: {
      ...(init?.headers as Record<string, string> ?? {}),
      Authorization: `Bearer ${token}`,
    },
  };
}
