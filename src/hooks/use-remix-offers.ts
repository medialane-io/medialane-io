import useSWR from "swr";
import type { ApiRemixOffer, ApiResponse, ConfirmRemixOfferParams, ConfirmSelfRemixParams, CreateRemixOfferParams } from "@medialane/sdk";
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

export async function submitRemixOffer(body: CreateRemixOfferParams): Promise<ApiRemixOffer> {
  return await getMedialaneClient().api.remix.submit(body);
}

export async function registerRemix(body: ConfirmSelfRemixParams): Promise<ApiRemixOffer> {
  return await getMedialaneClient().api.remix.confirmSelf(body);
}

export async function confirmRemixOffer(id: string, body: ConfirmRemixOfferParams): Promise<ApiRemixOffer> {
  return await getMedialaneClient().api.remix.confirm(id, body);
}
