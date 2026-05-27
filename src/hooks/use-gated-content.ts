"use client";

import useSWR from "swr";
import { useAuth } from "@clerk/nextjs";
import { apiFetch, ApiError } from "@/lib/api-fetch";

export interface GatedContent {
  title: string | null;
  url: string;
  type: string | null;
}

export type GatedContentState =
  | { status: "not_signed_in" }
  | { status: "loading" }
  | { status: "not_holder" }
  | { status: "unlocked"; content: GatedContent }
  | { status: "error" };

export function useGatedContent(contract: string | undefined): GatedContentState {
  const { getToken, isSignedIn } = useAuth();

  const { data, error, isLoading } = useSWR<GatedContent | "not_holder">(
    contract && isSignedIn ? ["gated-content", contract] : null,
    async () => {
      const token = await getToken();
      try {
        return await apiFetch<GatedContent>(
          `/v1/collections/${contract}/gated-content`,
          { bearer: token }
        );
      } catch (err) {
        // 403 is a meaningful state — caller is signed in but doesn't hold a
        // token from this collection. Map to a sentinel instead of an error.
        if (err instanceof ApiError && err.status === 403) return "not_holder";
        throw err;
      }
    },
    { shouldRetryOnError: false, revalidateOnFocus: false }
  );

  if (!isSignedIn) return { status: "not_signed_in" };
  if (isLoading) return { status: "loading" };
  if (error) return { status: "error" };
  if (data === "not_holder" || data === undefined) return { status: "not_holder" };
  return { status: "unlocked", content: data };
}
