"use client";

import useSWR from "swr";
import { useAuth } from "@clerk/nextjs";
import { getMedialaneClient } from "@/lib/medialane-client";

/**
 * Fetches the authenticated user's stored wallet address from medialane-backend.
 * Acts as a third-tier fallback when ChipiPay is unavailable and the Clerk JWT
 * session claim is also missing (e.g. stale token before re-sign-in).
 *
 * Returns null if the user has never completed onboarding (POST /v1/users/me).
 */
export function useMyWallet() {
  const { userId, getToken } = useAuth();

  const { data, isLoading } = useSWR(
    userId ? ["my-wallet", userId] : null,
    async () => {
      const token = await getToken({
        template: process.env.NEXT_PUBLIC_CLERK_TEMPLATE_NAME || "chipipay",
      });
      if (!token) return null;
      return getMedialaneClient().api.getMyWallet(token);
    },
    {
      revalidateOnFocus: false,
      shouldRetryOnError: false,
    }
  );

  return {
    backendWalletAddress: data?.walletAddress ?? null,
    isLoading,
  };
}
