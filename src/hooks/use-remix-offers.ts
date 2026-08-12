import useSWR from "swr";
import { useTokenRemixes as useTokenRemixesBase } from "@medialane/ui";
import { useWalletNativeSession } from "@/hooks/use-wallet-native-session";
import { useSiwsToken } from "@/hooks/use-siws-token";
import { apiFetch } from "@/lib/api-fetch";
import { MEDIALANE_BACKEND_URL, MEDIALANE_API_KEY } from "@/lib/constants";
import type { RemixOffer, RemixOfferListResponse } from "@/types/remix-offers";

const apiConfig = { baseUrl: MEDIALANE_BACKEND_URL, apiKey: MEDIALANE_API_KEY };

// ─── Hooks ────────────────────────────────────────────────────────────────────

/** List remix offers for the authenticated user. */
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

/** Public remixes of a token. */
export function useTokenRemixes(contract: string | null, tokenId: string | null) {
  return useTokenRemixesBase(apiConfig, contract, tokenId);
}

// ─── Mutation helpers ─────────────────────────────────────────────────────────

/** Submit a custom license offer (Path 3). */
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

/** Submit an auto (open-license) offer (Path 2). */
export async function submitAutoRemixOffer(
  body: { originalContract: string; originalTokenId: string },
  token: string
): Promise<RemixOffer> {
  const res = await apiFetch<{ data: RemixOffer }>(`/v1/remix-offers/auto`, { method: "POST", body, bearer: token });
  return res.data;
}

/**
 * Record a completed remix — the parent→child attribution link (Path 1).
 * Used by any remixer's direct self-mint, not only the parent owner.
 */
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

/** Record completed mint + listing (Paths 2 & 3). */
export async function confirmRemixOffer(
  id: string,
  body: { remixContract: string; remixTokenId: string; approvedCollection: string; orderHash: string },
  token: string
): Promise<RemixOffer> {
  const res = await apiFetch<{ data: RemixOffer }>(`/v1/remix-offers/${id}/confirm`, { method: "POST", body, bearer: token });
  return res.data;
}

/** Reject an offer. */
export async function rejectRemixOffer(id: string, token: string): Promise<RemixOffer> {
  const res = await apiFetch<{ data: RemixOffer }>(`/v1/remix-offers/${id}/reject`, { method: "POST", body: {}, bearer: token });
  return res.data;
}

/** Extend the expiry of a pending offer by 1–30 days. */
export async function extendRemixOffer(id: string, days: number, token: string): Promise<RemixOffer> {
  const res = await apiFetch<{ data: RemixOffer }>(`/v1/remix-offers/${id}/extend`, { method: "POST", body: { days }, bearer: token });
  return res.data;
}
