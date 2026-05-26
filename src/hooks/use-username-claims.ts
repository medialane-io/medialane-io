"use client";

import useSWR from "swr";
import { useAuth } from "@clerk/nextjs";
import { type ApiCreatorProfile } from "@medialane/sdk";
import { getMedialaneClient } from "@/lib/medialane-client";
import { apiFetch, ApiError } from "@/lib/api-fetch";

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
      return apiFetch<{ username: string | null; claim: UsernameClaim | null }>(
        "/v1/username-claims/me",
        { bearer: token }
      );
    },
    { revalidateOnFocus: false, shouldRetryOnError: false }
  );

  return { username: data?.username ?? null, claim: data?.claim ?? null, isLoading, error, mutate };
}

/** Check if a username is available (no auth required). */
export async function checkUsernameAvailability(
  username: string
): Promise<{ available: boolean; reason?: string }> {
  return apiFetch<{ available: boolean; reason?: string }>(
    `/v1/username-claims/check/${encodeURIComponent(username)}`
  );
}

/** Submit a username claim. */
export async function submitUsernameClaim(
  username: string,
  token: string,
  notifyEmail?: string
): Promise<{ claim?: UsernameClaim; error?: string }> {
  try {
    const json = await apiFetch<{ claim: UsernameClaim }>("/v1/username-claims", {
      method: "POST",
      bearer: token,
      body: { username, ...(notifyEmail ? { notifyEmail } : {}) },
    });
    return { claim: json.claim };
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Failed to submit claim" };
  }
}

/** Resolve a username slug to a creator profile (public, no auth). */
export function useCreatorByUsername(username: string | null | undefined) {
  const { data, error, isLoading } = useSWR(
    username ? `creator-by-username-${username}` : null,
    () => getMedialaneClient().api.getCreatorByUsername(username!),
    { revalidateOnFocus: false, revalidateOnMount: true }
  );
  return { creator: data ?? null, isLoading, error };
}
