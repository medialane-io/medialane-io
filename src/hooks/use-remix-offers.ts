import useSWR from "swr";
import { useTokenRemixes as useTokenRemixesBase } from "@medialane/ui";
import { useWalletNativeSession } from "@/hooks/use-wallet-native-session";
import { useSiwsToken } from "@/hooks/use-siws-token";
import { apiFetch } from "@/lib/api-fetch";
import { MEDIALANE_BACKEND_URL, MEDIALANE_API_KEY } from "@/lib/constants";
import type { RemixOffer, RemixOfferListResponse } from "@/types/remix-offers";

const apiConfig = { baseUrl: MEDIALANE_BACKEND_URL, apiKey: MEDIALANE_API_KEY };

export function useRemixOffers(role: "creator" | "requester", status?: string) {
  const { address: walletAddress } = useWalletNativeSession();
  const { getValidToken, signIn } = useSiwsToken();

  const key = walletAddress ? `remix-offers-${role}-${status ?? "all"}` : null;

  const { data, error, isLoading, mutate } = useSWR<RemixOfferListResponse>(
    key,
    async () => {
      const token = getValidToken() ?? (await signIn());
      const params = new URLSearchParams({ role, ...(status ? { status } : {}) });
      return apiFetch(`/v1/remix-offers?${params}`, { bearer: token });
    },
    { refreshInterval: 30000, revalidateOnFocus: false }
  );

  return { offers: data?.data ?? [], total: data?.meta.total ?? 0, isLoading, error, mutate };
}

export function useTokenRemixes(contract: string | null, tokenId: string | null) {
  return useTokenRemixesBase(apiConfig, contract, tokenId);
}

export async function submitRemixOffer(
  body: {
    originalContract: string;
    originalTokenId: string;
    proposedPrice: string;
    proposedCurrency: string;
    licenseType: string;
    commercial: boolean;
    derivatives: boolean;
    royaltyPct?: number;
    message?: string;
    expiresInDays?: number;
  },
  token: string
): Promise<RemixOffer> {
  const res = await apiFetch<{ data: RemixOffer }>(`/v1/remix-offers`, { method: "POST", body, bearer: token });
  return res.data;
}

export async function registerRemix(
  body: {
    originalContract: string;
    originalTokenId: string;
    remixContract: string;
    remixTokenId: string;
    txHash: string;
    licenseType: string;
    commercial: boolean;
    derivatives: boolean;
    royaltyPct?: number;
  },
  token: string
): Promise<RemixOffer> {
  const res = await apiFetch<{ data: RemixOffer }>(`/v1/remix-offers/self/confirm`, { method: "POST", body, bearer: token });
  return res.data;
}

export async function confirmRemixOffer(
  id: string,
  body: { remixContract: string; remixTokenId: string; approvedCollection: string; orderHash: string },
  token: string
): Promise<RemixOffer> {
  const res = await apiFetch<{ data: RemixOffer }>(`/v1/remix-offers/${id}/confirm`, { method: "POST", body, bearer: token });
  return res.data;
}
