"use client";

import useSWR from "swr";
import { useAuth } from "@clerk/nextjs";
import { type ApiCreatorProfile } from "@medialane/sdk";
import { getMedialaneClient } from "@/lib/medialane-client";
import { MEDIALANE_BACKEND_URL, MEDIALANE_API_KEY } from "@/lib/constants";

export interface UsernameClaim {
  id: string;
  username: string;
  walletAddress: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  adminNotes: string | null;
  reviewedAt: string | null;
  createdAt: string;
}

export type { ApiCreatorProfile as CreatorByUsername };

/** Fetch the current user's username claim status (requires Clerk auth + API key). */
export function useMyUsernameClaim() {
  const { getToken, isSignedIn } = useAuth();

  const { data, error, isLoading, mutate } = useSWR(
    isSignedIn ? "username-claim-me" : null,
    async () => {
      const token = await getToken();
      const res = await fetch(`${MEDIALANE_BACKEND_URL}/v1/username-claims/me`, {
        headers: {
          "x-api-key": MEDIALANE_API_KEY,
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!res.ok) throw new Error("Failed to fetch username claim");
      return res.json() as Promise<{ username: string | null; claim: UsernameClaim | null }>;
    },
    { revalidateOnFocus: false }
  );

  return { username: data?.username ?? null, claim: data?.claim ?? null, isLoading, error, mutate };
}

/** Check if a username is available (no auth required). */
export async function checkUsernameAvailability(
  username: string
): Promise<{ available: boolean; reason?: string }> {
  const res = await fetch(`${MEDIALANE_BACKEND_URL}/v1/username-claims/check/${encodeURIComponent(username)}`, {
    headers: { "x-api-key": MEDIALANE_API_KEY },
  });
  return res.json();
}

/** Submit a username claim. */
export async function submitUsernameClaim(
  username: string,
  token: string,
  notifyEmail?: string
): Promise<{ claim?: UsernameClaim; error?: string }> {
  const res = await fetch(`${MEDIALANE_BACKEND_URL}/v1/username-claims`, {
    method: "POST",
    headers: {
      "x-api-key": MEDIALANE_API_KEY,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username, ...(notifyEmail ? { notifyEmail } : {}) }),
  });
  const json = await res.json();
  if (!res.ok) return { error: json.error ?? "Failed to submit claim" };
  return { claim: json.claim };
}

/** Resolve a username slug to a creator profile (public, no auth). */
export function useCreatorByUsername(username: string | null | undefined) {
  const { data, error, isLoading } = useSWR(
    username ? `creator-by-username-${username}` : null,
    () => getMedialaneClient().api.getCreatorByUsername(username!),
    { revalidateOnFocus: false }
  );
  return { creator: data ?? null, isLoading, error };
}
