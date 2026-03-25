import type { MetadataRoute } from "next";
import { IP_TYPE_CONFIG } from "@/lib/ip-type-config";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://medialane.io";
const BACKEND_URL =
  process.env.NEXT_PUBLIC_MEDIALANE_BACKEND_URL ||
  "https://medialane-backend-production.up.railway.app";
const API_KEY = process.env.NEXT_PUBLIC_MEDIALANE_API_KEY || "";

async function fetchJson<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${BACKEND_URL}${path}`, {
      headers: { "x-api-key": API_KEY },
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    return res.json() as Promise<T>;
  } catch {
    return null;
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE_URL, changeFrequency: "daily", priority: 1 },
    { url: `${BASE_URL}/discover`, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE_URL}/marketplace`, changeFrequency: "hourly", priority: 0.9 },
    { url: `${BASE_URL}/collections`, changeFrequency: "hourly", priority: 0.9 },
    { url: `${BASE_URL}/creators`, changeFrequency: "daily", priority: 0.8 },
    { url: `${BASE_URL}/launchpad`, changeFrequency: "daily", priority: 0.8 },
    { url: `${BASE_URL}/activities`, changeFrequency: "hourly", priority: 0.6 },
    { url: `${BASE_URL}/about`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/learn`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/docs`, changeFrequency: "monthly", priority: 0.5 },
  ];

  // IP type browse pages
  const ipTypeRoutes: MetadataRoute.Sitemap = IP_TYPE_CONFIG.map(({ slug }) => ({
    url: `${BASE_URL}/${slug}`,
    changeFrequency: "daily" as const,
    priority: 0.7,
  }));

  const [collectionsData, tokensData, creatorsData] = await Promise.all([
    fetchJson<{ data: { contractAddress: string; updatedAt?: string }[] }>(
      "/v1/collections?limit=500"
    ),
    fetchJson<{ data: { contractAddress: string; tokenId: string; updatedAt?: string }[] }>(
      "/v1/tokens?limit=2000"
    ),
    fetchJson<{ data: { username?: string; walletAddress: string }[] }>(
      "/v1/creators?limit=500"
    ),
  ]);

  const collectionRoutes: MetadataRoute.Sitemap = (collectionsData?.data ?? []).map((c) => ({
    url: `${BASE_URL}/collections/${c.contractAddress}`,
    changeFrequency: "daily" as const,
    priority: 0.7,
    lastModified: c.updatedAt ? new Date(c.updatedAt) : undefined,
  }));

  const tokenRoutes: MetadataRoute.Sitemap = (tokensData?.data ?? []).map((t) => ({
    url: `${BASE_URL}/asset/${t.contractAddress}/${t.tokenId}`,
    changeFrequency: "weekly" as const,
    priority: 0.5,
    lastModified: t.updatedAt ? new Date(t.updatedAt) : undefined,
  }));

  const creatorRoutes: MetadataRoute.Sitemap = (creatorsData?.data ?? [])
    .filter((c) => c.username)
    .map((c) => ({
      url: `${BASE_URL}/creator/${c.username}`,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }));

  return [...staticRoutes, ...ipTypeRoutes, ...collectionRoutes, ...tokenRoutes, ...creatorRoutes];
}
