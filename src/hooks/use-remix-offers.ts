import useSWR from "swr";
import { useAuth } from "@clerk/nextjs";
import { useSessionKey } from "@/hooks/use-session-key";
import type { RemixOffer, RemixOfferListResponse, PublicRemix } from "@/types/remix-offers";

// Client-side hook. All requests go through the same-origin BFF proxy at
// `/api/proxy/v1/...`, which injects the server-only API key. The key is
// never present in the browser bundle.
const API_BASE = "/api/proxy";

// ─── Fetcher helpers ──────────────────────────────────────────────────────────

async function apiFetch(url: string, clerkToken?: string | null, options?: RequestInit) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(clerkToken ? { Authorization: `Bearer ${clerkToken}` } : {}),
  };
  const res = await fetch(url, { ...options, headers: { ...headers, ...(options?.headers as Record<string, string> ?? {}) } });
  if (!res.ok) {
    const err: unknown = await res.json().catch(() => ({}));
    const errorMsg =
      err && typeof err === "object" && "error" in err && typeof err.error === "string"
        ? err.error
        : `Request failed: ${res.status}`;
    throw new Error(errorMsg);
  }
  return res.json();
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

/** List remix offers for the authenticated user. */
export function useRemixOffers(role: "creator" | "requester", status?: string) {
  const { getToken } = useAuth();
  const { walletAddress } = useSessionKey();

  const key = walletAddress ? `remix-offers-${role}-${status ?? "all"}` : null;

  const { data, error, isLoading, mutate } = useSWR<RemixOfferListResponse>(
    key,
    async () => {
      const token = await getToken();
      const params = new URLSearchParams({ role, ...(status ? { status } : {}) });
      return apiFetch(`${API_BASE}/v1/remix-offers?${params}`, token);
    },
    { refreshInterval: 30000, revalidateOnFocus: false }
  );

  return { offers: data?.data ?? [], total: data?.meta.total ?? 0, isLoading, error, mutate };
}

/** Public remixes of a token. */
export function useTokenRemixes(contract: string | null, tokenId: string | null) {
  const { data, error, isLoading, mutate } = useSWR<{ data: PublicRemix[]; meta: { total: number } }>(
    contract && tokenId ? `token-remixes-${contract}-${tokenId}` : null,
    () =>
      fetch(`${API_BASE}/v1/tokens/${contract}/${tokenId}/remixes`).then((r) => r.json()),
    { refreshInterval: 60000, revalidateOnFocus: false }
  );

  return { remixes: data?.data ?? [], total: data?.meta.total ?? 0, isLoading, error, mutate };
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
  const res = await apiFetch(`${API_BASE}/v1/remix-offers`, clerkToken, {
    method: "POST",
    body: JSON.stringify(body),
  });
  return res.data;
}

/** Submit an auto (open-license) offer (Path 2). */
export async function submitAutoRemixOffer(
  body: { originalContract: string; originalTokenId: string },
  clerkToken: string
): Promise<RemixOffer> {
  const res = await apiFetch(`${API_BASE}/v1/remix-offers/auto`, clerkToken, {
    method: "POST",
    body: JSON.stringify(body),
  });
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
  clerkToken: string
): Promise<RemixOffer> {
  const res = await apiFetch(`${API_BASE}/v1/remix-offers/self/confirm`, clerkToken, {
    method: "POST",
    body: JSON.stringify(body),
  });
  return res.data;
}

/** Record completed mint + listing (Paths 2 & 3). */
export async function confirmRemixOffer(
  id: string,
  body: { remixContract: string; remixTokenId: string; approvedCollection: string; orderHash: string },
  clerkToken: string
): Promise<RemixOffer> {
  const res = await apiFetch(`${API_BASE}/v1/remix-offers/${id}/confirm`, clerkToken, {
    method: "POST",
    body: JSON.stringify(body),
  });
  return res.data;
}

/** Reject an offer. */
export async function rejectRemixOffer(id: string, clerkToken: string): Promise<RemixOffer> {
  const res = await apiFetch(`${API_BASE}/v1/remix-offers/${id}/reject`, clerkToken, {
    method: "POST",
    body: JSON.stringify({}),
  });
  return res.data;
}

/** Extend the expiry of a pending offer by 1–30 days. */
export async function extendRemixOffer(id: string, days: number, clerkToken: string): Promise<RemixOffer> {
  const res = await apiFetch(`${API_BASE}/v1/remix-offers/${id}/extend`, clerkToken, {
    method: "POST",
    body: JSON.stringify({ days }),
  });
  return res.data;
}
