

import { ipfsToHttp as sharedIpfsToHttp } from "@medialane/ui";

const BASE = process.env.NEXT_PUBLIC_MEDIALANE_BACKEND_URL ?? "";
const KEY  = process.env.MEDIALANE_API_KEY ?? "";

async function apiFetch<T>(path: string): Promise<T | null> {
  try {

    const res = await fetch(`${BASE}${path}`, {
      headers: { "x-api-key": KEY },
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data as T;
  } catch {
    return null;
  }
}

// Feeds og:image and twitter:image, so the result has to be an absolute URL a
// crawler can fetch without our app in the path. It previously pointed at
// /api/ipfs, a route that was deleted — every social preview resolved to a 404.
// The public gateway is already what the browser-side resolver uses.
export function ipfsToHttpServer(uri: string | null | undefined): string {
  if (!uri) return "";
  return sharedIpfsToHttp(uri) || "";
}

export async function fetchTokenMeta(contract: string, tokenId: string) {
  return apiFetch<{ name?: string; description?: string; image?: string; metadata?: { name?: string; description?: string; image?: string } }>(
    `/v1/tokens/${contract}/${tokenId}`
  );
}

export async function fetchCollectionMeta(contract: string) {
  return apiFetch<{ name?: string; description?: string; image?: string; totalSupply?: number }>(
    `/v1/collections/${contract}`
  );
}

export async function fetchDropMeta(contract: string) {
  return apiFetch<{ name?: string | null; description?: string | null; image?: string | null }>(
    `/v1/drop/${contract}/info`
  );
}

export async function fetchCoinMeta(contract: string) {
  return apiFetch<{ name?: string; description?: string; image?: string; creator?: string }>(
    `/v1/coins/${contract}`
  );
}

export async function fetchCreatorProfile(username: string) {
  return apiFetch<{
    walletAddress?: string;
    username?: string;
    displayName?: string;
    bio?: string;
    avatarImage?: string;
    websiteUrl?: string | null;
    twitterUrl?: string | null;
    discordUrl?: string | null;
    telegramUrl?: string | null;
  }>(`/v1/creators/by-username/${encodeURIComponent(username.toLowerCase())}`);
}
