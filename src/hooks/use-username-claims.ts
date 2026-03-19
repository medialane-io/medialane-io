"use client";

import useSWR from "swr";
import { useAuth } from "@clerk/nextjs";
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

export interface CreatorByUsername {
  walletAddress: string;
  username: string;
  displayName: string | null;
  bio: string | null;
  avatarImage: string | null;
  bannerImage: string | null;
  websiteUrl: string | null;
  twitterUrl: string | null;
  discordUrl: string | null;
  telegramUrl: string | null;
}

/** Fetch the current user's username claim status (requires Clerk auth + API key). */
export function useMyUsernameClaim() {
  const { getToken } = useAuth();

  const { data, error, isLoading, mutate } = useSWR(
    "username-claim-me",
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

/** Submit a username claim. */
export async function submitUsernameClaim(
  username: string,
  token: string
): Promise<{ claim?: UsernameClaim; error?: string }> {
  const res = await fetch(`${MEDIALANE_BACKEND_URL}/v1/username-claims`, {
    method: "POST",
    headers: {
      "x-api-key": MEDIALANE_API_KEY,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username }),
  });
  const json = await res.json();
  if (!res.ok) return { error: json.error ?? "Failed to submit claim" };
  return { claim: json.claim };
}

/** Resolve a username slug to a creator profile (public, no auth). */
export function useCreatorByUsername(username: string | null | undefined) {
  const { data, error, isLoading } = useSWR(
    username ? `creator-by-username-${username}` : null,
    async () => {
      const res = await fetch(
        `${MEDIALANE_BACKEND_URL}/v1/creators/by-username/${encodeURIComponent(username!)}`,
        { headers: { "x-api-key": MEDIALANE_API_KEY } }
      );
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch creator");
      return res.json() as Promise<CreatorByUsername>;
    },
    { revalidateOnFocus: false }
  );
  return { creator: data ?? null, isLoading, error };
}
