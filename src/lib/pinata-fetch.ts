"use client";

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
