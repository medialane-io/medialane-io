"use client";

import useSWR from "swr";
import { useAuth } from "@clerk/nextjs";
import { MEDIALANE_BACKEND_URL, MEDIALANE_API_KEY } from "@/lib/constants";

export interface GatedContent {
  title: string | null;
  url: string;
  type: string | null;
}

interface UseGatedContentResult {
  content: GatedContent | null;
  isHolder: boolean;
  isLoading: boolean;
  error: unknown;
}

export function useGatedContent(contract: string | undefined): UseGatedContentResult {
  const { getToken, isSignedIn } = useAuth();

  const { data, error, isLoading } = useSWR<GatedContent>(
    contract && isSignedIn ? ["gated-content", contract] : null,
    async () => {
      const token = await getToken();
      const res = await fetch(
        `${MEDIALANE_BACKEND_URL}/v1/collections/${contract}/gated-content`,
        {
          headers: {
            "x-api-key": MEDIALANE_API_KEY,
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        }
      );
      if (res.status === 403) {
        // Not a holder — return sentinel
        return null as unknown as GatedContent;
      }
      if (!res.ok) throw new Error("Failed to fetch gated content");
      return res.json();
    },
    { shouldRetryOnError: false, revalidateOnFocus: false }
  );

  // error with status 403 means not a holder (we return null above, so error = real fetch failure)
  const isHolder = !error && data !== undefined && data !== null;

  return {
    content: data ?? null,
    isHolder,
    isLoading,
    error,
  };
}
