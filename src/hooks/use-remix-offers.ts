import useSWR from "swr";
import { useAuth } from "@clerk/nextjs";
import { useSessionKey } from "@/hooks/use-session-key";
import { useMedialaneClient } from "@/hooks/use-medialane-client";
import { getMedialaneClient } from "@/lib/medialane-client";
import type { RemixOffer, RemixOfferListResponse, PublicRemix } from "@/types/remix-offers";

// ─── Hooks ────────────────────────────────────────────────────────────────────

/** List remix offers for the authenticated user. */
export function useRemixOffers(role: "creator" | "requester", status?: string) {
  const { getToken } = useAuth();
  const { walletAddress } = useSessionKey();
  const client = useMedialaneClient();

  const key = walletAddress ? `remix-offers-${role}-${status ?? "all"}` : null;

  const { data, error, isLoading, mutate } = useSWR<RemixOfferListResponse>(
    key,
    async () => {
      const token = await getToken();
      return client.api.getRemixOffers({ role }, token!) as Promise<RemixOfferListResponse>;
    },
    { refreshInterval: 30000, revalidateOnFocus: false }
  );

  return { offers: data?.data ?? [], total: data?.meta.total ?? 0, isLoading, error, mutate };
}

/** Public remixes of a token. */
export function useTokenRemixes(contract: string | null, tokenId: string | null) {
  const client = useMedialaneClient();

  const { data, error, isLoading, mutate } = useSWR<{ data: PublicRemix[]; meta: { total: number } }>(
    contract && tokenId ? `token-remixes-${contract}-${tokenId}` : null,
    () => client.api.getTokenRemixes(contract!, tokenId!) as Promise<{ data: PublicRemix[]; meta: { total: number } }>,
    { refreshInterval: 60000, revalidateOnFocus: false }
  );

  return { remixes: data?.data ?? [], total: data?.meta?.total ?? 0, isLoading, error, mutate };
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
  clerkToken: string
): Promise<RemixOffer> {
  const res = await getMedialaneClient().api.submitRemixOffer(body, clerkToken);
  return res.data as RemixOffer;
}

/** Submit an auto (open-license) offer (Path 2). */
export async function submitAutoRemixOffer(
  body: { originalContract: string; originalTokenId: string; licenseType: string },
  clerkToken: string
): Promise<RemixOffer> {
  const res = await getMedialaneClient().api.submitAutoRemixOffer(body, clerkToken);
  return res.data as RemixOffer;
}

/** Record completed self-remix (Path 1). */
export async function confirmSelfRemix(
  body: {
    originalContract: string;
    originalTokenId: string;
    remixContract: string;
    remixTokenId: string;
    txHash?: string;
    licenseType: string;
    commercial: boolean;
    derivatives: boolean;
    royaltyPct?: number;
  },
  clerkToken: string
): Promise<RemixOffer> {
  const res = await getMedialaneClient().api.confirmSelfRemix(body, clerkToken);
  return res.data as RemixOffer;
}

/** Record completed mint + listing (Paths 2 & 3). */
export async function confirmRemixOffer(
  id: string,
  body: { remixContract: string; remixTokenId: string; approvedCollection: string; orderHash: string },
  clerkToken: string
): Promise<RemixOffer> {
  const res = await getMedialaneClient().api.confirmRemixOffer(id, body, clerkToken);
  return res.data as RemixOffer;
}

/** Reject an offer. */
export async function rejectRemixOffer(id: string, clerkToken: string): Promise<RemixOffer> {
  const res = await getMedialaneClient().api.rejectRemixOffer(id, clerkToken);
  return res.data as RemixOffer;
}
