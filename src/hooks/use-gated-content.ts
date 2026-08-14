"use client";

import useSWR from "swr";
import { apiFetch, ApiError } from "@/lib/api-fetch";
import { useWalletNativeSession } from "@/hooks/use-wallet-native-session";
import { useSiwsToken } from "@/hooks/use-siws-token";

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
  const { hasWallet } = useWalletNativeSession();
  const { getValidToken, signIn } = useSiwsToken();

  const { data, error, isLoading } = useSWR<GatedContent | "not_holder">(
    contract && hasWallet ? ["gated-content", contract] : null,
    async () => {
      const token = getValidToken() ?? (await signIn());
      try {
        return await apiFetch<GatedContent>(
          `/v1/collections/${contract}/gated-content`,
          { bearer: token }
        );
      } catch (err) {

        if (err instanceof ApiError && err.status === 403) return "not_holder";
        throw err;
      }
    },
    { shouldRetryOnError: false, revalidateOnFocus: false }
  );

  if (!hasWallet) return { status: "not_signed_in" };
  if (isLoading) return { status: "loading" };
  if (error) return { status: "error" };
  if (data === "not_holder" || data === undefined) return { status: "not_holder" };
  return { status: "unlocked", content: data };
}
