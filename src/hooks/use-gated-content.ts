"use client";

import useSWR from "swr";
import { useAuth } from "@clerk/nextjs";
import { MEDIALANE_BACKEND_URL, MEDIALANE_API_KEY } from "@/lib/constants";

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
      const res = await fetch(
        `${MEDIALANE_BACKEND_URL}/v1/collections/${contract}/gated-content`,
        {
          headers: {
            "x-api-key": MEDIALANE_API_KEY,
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        }
      );
      if (res.status === 403) return "not_holder";
      if (!res.ok) throw new Error(`${res.status}`);
      return res.json();
    },
    { shouldRetryOnError: false, revalidateOnFocus: false }
  );

  if (!isSignedIn) return { status: "not_signed_in" };
  if (isLoading) return { status: "loading" };
  if (error) return { status: "error" };
  if (data === "not_holder" || data === undefined) return { status: "not_holder" };
  return { status: "unlocked", content: data };
}
