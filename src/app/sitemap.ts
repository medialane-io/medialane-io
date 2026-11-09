import type { MetadataRoute } from "next";
import { IP_TYPE_DATA } from "@medialane/ui";
import { APP_URL } from "@/lib/seo";

const BASE_URL = APP_URL;

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE_URL, changeFrequency: "daily", priority: 1 },
    { url: `${BASE_URL}/discover`, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE_URL}/marketplace`, changeFrequency: "hourly", priority: 0.9 },
    { url: `${BASE_URL}/collections`, changeFrequency: "hourly", priority: 0.9 },
    { url: `${BASE_URL}/creators`, changeFrequency: "daily", priority: 0.8 },
    { url: `${BASE_URL}/launchpad`, changeFrequency: "daily", priority: 0.8 },
    { url: `${BASE_URL}/launchpad/drop`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE_URL}/launchpad/pop`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE_URL}/launchpad/nfteditions`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE_URL}/mint`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE_URL}/br/mint`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE_URL}/airdrop`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE_URL}/claim`, changeFrequency: "weekly", priority: 0.5 },
    { url: `${BASE_URL}/claim/collection`, changeFrequency: "weekly", priority: 0.5 },
    { url: `${BASE_URL}/claim/username`, changeFrequency: "weekly", priority: 0.5 },
    { url: `${BASE_URL}/claim/collection-name`, changeFrequency: "weekly", priority: 0.5 },
    { url: `${BASE_URL}/claim/memecoin`, changeFrequency: "weekly", priority: 0.5 },
    { url: `${BASE_URL}/activities`, changeFrequency: "hourly", priority: 0.6 },
  ];

  const ipTypeRoutes: MetadataRoute.Sitemap = IP_TYPE_DATA.map(({ slug }) => ({
    url: `${BASE_URL}/${slug}`,
    changeFrequency: "daily" as const,
    priority: 0.7,
  }));

  return [...staticRoutes, ...ipTypeRoutes];
}
