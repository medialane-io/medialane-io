"use client";

import useSWR, { mutate } from "swr";
import type { ApiSession } from "@medialane/sdk";

const SESSION_KEY = "/api/session";

async function fetchSession(): Promise<ApiSession | null> {
  const res = await fetch(SESSION_KEY, { cache: "no-store" });
  if (!res.ok) throw new Error("Session check failed");
  return (await res.json()) as ApiSession | null;
}

export function useSession(): { session: ApiSession | null; isLoading: boolean } {
  const { data, isLoading } = useSWR(SESSION_KEY, fetchSession, { shouldRetryOnError: false });
  return { session: data ?? null, isLoading: data === undefined && isLoading };
}

export const refreshSession = () => mutate(SESSION_KEY);
