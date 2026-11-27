import { unstable_cache } from "next/cache";
import { createServerReads } from "@medialane/ui/utils/server-reads";
import { getMedialaneClient } from "@/lib/medialane-client";
import { MEDIALANE_BACKEND_URL } from "@/lib/constants";
import { absoluteUrl } from "@/lib/seo";

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
  backendUrl: MEDIALANE_BACKEND_URL,
  absoluteUrl,
});
