/**
 * Server-side fetch helpers for generateMetadata.
 * Uses NEXT_PUBLIC_ env vars — safe to reference in server components.
 * Returns null on any error so metadata falls back gracefully.
 */

const BASE = process.env.NEXT_PUBLIC_MEDIALANE_BACKEND_URL ?? "";
const KEY  = process.env.NEXT_PUBLIC_MEDIALANE_API_KEY ?? "";

async function apiFetch<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${BASE}${path}`, {
      headers: { "x-api-key": KEY },
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data as T;
  } catch {
    return null;
  }
}

export function ipfsToHttpServer(uri: string | null | undefined): string {
  if (!uri) return "";
  if (uri.startsWith("ipfs://")) return `https://gateway.pinata.cloud/ipfs/${uri.slice(7)}`;
  return uri;
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
