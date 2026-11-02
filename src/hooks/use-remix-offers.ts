import useSWR from "swr";
import type { ApiRemixOffer, ApiResponse } from "@medialane/sdk";
import { useWalletNativeSession } from "@/hooks/use-wallet-native-session";
import { useSession } from "@/hooks/use-session";
import { requireSignedIn } from "@/lib/account-gate";
import { getMedialaneClient } from "@/lib/medialane-client";

export function useRemixOffers(role: "creator" | "requester", status?: string) {
  const { address: walletAddress } = useWalletNativeSession();
  const { session } = useSession();
  const key = walletAddress ? `remix-offers-${role}-${status ?? "all"}` : null;

  const { data, error, isLoading, mutate } = useSWR<ApiResponse<ApiRemixOffer[]>>(
    key,
    async () => {
      requireSignedIn(session);
      return getMedialaneClient().api.remix.list({ role, status });
    },
    { refreshInterval: 30000, revalidateOnFocus: false }
  );

  return { offers: data?.data ?? [], total: data?.meta?.total ?? 0, isLoading, error, mutate };
}
