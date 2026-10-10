"use client";

import useSWR, { mutate } from "swr";
import type { ApiSession } from "@medialane/sdk";
import { getMedialaneClient } from "@/lib/medialane-client";

const SESSION_KEY = "account-session";

export function useSession(): { session: ApiSession | null; isLoading: boolean } {
  const { data, isLoading } = useSWR(SESSION_KEY, () => getMedialaneClient().api.getSession(), {
    shouldRetryOnError: false,
  });
  return { session: data ?? null, isLoading: data === undefined && isLoading };
}

export const refreshSession = () => mutate(SESSION_KEY);
