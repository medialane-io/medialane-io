import { sitemapIndexXml } from "@medialane/ui";
import { APP_URL } from "@/lib/seo";
import { generateSitemaps } from "../sitemap";

export const revalidate = 3600;

export async function GET() {
  const sitemaps = await generateSitemaps();
  const xml = sitemapIndexXml(sitemaps.map(({ id }) => `${APP_URL}/sitemap/${id}.xml`));
  return new Response(xml, { headers: { "Content-Type": "application/xml" } });
}
