import useSWR from "swr";
import type { ApiRemixOffer, ApiResponse, ConfirmRemixOfferParams, ConfirmSelfRemixParams, CreateRemixOfferParams } from "@medialane/sdk";
import { useTokenRemixes as useTokenRemixesBase } from "@medialane/ui";
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
      return getMedialaneClient().api.getRemixOffers({ role, status });
    },
    { refreshInterval: 30000, revalidateOnFocus: false }
  );

  return { offers: data?.data ?? [], total: data?.meta?.total ?? 0, isLoading, error, mutate };
}

export function useTokenRemixes(contract: string | null, tokenId: string | null) {
  return useTokenRemixesBase(getMedialaneClient, contract, tokenId);
}

export async function submitRemixOffer(body: CreateRemixOfferParams): Promise<ApiRemixOffer> {
  return (await getMedialaneClient().api.submitRemixOffer(body)).data;
}

export async function registerRemix(body: ConfirmSelfRemixParams): Promise<ApiRemixOffer> {
  return (await getMedialaneClient().api.confirmSelfRemix(body)).data;
}

export async function confirmRemixOffer(id: string, body: ConfirmRemixOfferParams): Promise<ApiRemixOffer> {
  return (await getMedialaneClient().api.confirmRemixOffer(id, body)).data;
}
