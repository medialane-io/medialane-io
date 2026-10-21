import { unstable_cache } from "next/cache";
import { getMedialaneClient } from "@/lib/medialane-client";
import { toAbsoluteImageUrl } from "@medialane/ui/utils/ipfs";
import { absoluteUrl } from "@/lib/seo";

const REVALIDATE_SECONDS = 60;
const api = () => getMedialaneClient().api;

/** Server-side reads for page metadata: cached briefly, and null when the backend can't answer. */
function cached<A extends (string | number)[], T>(name: string, read: (...args: A) => Promise<T>) {
  return unstable_cache(
    async (...args: A): Promise<T | null> => {
      try {
        return await read(...args);
      } catch {
        return null;
      }
    },
    [name],
    { revalidate: REVALIDATE_SECONDS },
  );
}

const BACKEND_ORIGIN = new URL(process.env.NEXT_PUBLIC_MEDIALANE_BACKEND_URL ?? "http://localhost:3001").origin;

/** Absolute image URL for page metadata; images served by the backend go through this app's image proxy. */
export function ipfsToHttpServer(uri: string | null | undefined): string {
  const url = toAbsoluteImageUrl(uri);
  return url.startsWith(`${BACKEND_ORIGIN}/`) ? absoluteUrl(`/api/img?url=${encodeURIComponent(url)}`) : url;
}

export const fetchTokenMeta = cached("token-meta", async (contract: string, tokenId: string) =>
  (await api().getToken(contract, tokenId)).data);

export const fetchCollectionMeta = cached("collection-meta", async (contract: string) =>
  (await api().getCollection(contract)).data);

export const fetchFeaturedCollections = cached("featured-collections", async (limit: number) =>
  (await api().listCollections({ page: 1, limit, sort: "recent", isFeatured: true, hideEmpty: true })).data);

export const fetchDropMeta = cached("drop-meta", (contract: string) => api().getDrop(contract));

export const fetchCoinMeta = cached("coin-meta", async (contract: string) => (await api().getCoin(contract)).data);

export const fetchCreatorProfile = cached("creator-profile", (username: string) => api().getCreatorByUsername(username));
