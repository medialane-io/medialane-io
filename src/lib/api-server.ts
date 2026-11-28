import { unstable_cache } from "next/cache";
import { createServerReads } from "@medialane/ui/utils/server-reads";
import { getMedialaneClient } from "@/lib/medialane-client";

export const {
  ipfsToHttpServer,
  fetchTokenMeta,
  fetchCollectionMeta,
  fetchCollectionBySlug,
  fetchFeaturedCollections,
  fetchDropMeta,
  fetchCoinMeta,
  fetchCreatorProfile,
} = createServerReads({
  api: () => getMedialaneClient().api,
  cache: unstable_cache,
});
