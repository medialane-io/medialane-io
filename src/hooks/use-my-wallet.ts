"use client";

import useSWR from "swr";
import { useAuth } from "@clerk/nextjs";
import { getMedialaneClient } from "@/lib/medialane-client";

/**
 * Fetches the authenticated user's stored wallet address from medialane-backend.
 * Acts as a third-tier fallback when ChipiPay is unavailable and the Clerk JWT
 * session claim is also missing (e.g. stale token before re-sign-in).
 *
 * On first load for existing users (who have a Clerk publicMetadata wallet but
 * haven't stored it in the backend yet), automatically upserts the address so
 * the DB stays in sync — no user action required.
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

      const existing = await getMedialaneClient().api.getMyWallet(token);
      if (existing) return existing;

      // Not yet stored — upsert now. Backend reads wallet from Clerk publicMetadata.
      // This transparently backfills all existing users on their next page load.
      try {
        return await getMedialaneClient().api.upsertMyWallet(token);
      } catch {
        return null;
      }
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
