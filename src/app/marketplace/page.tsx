import type { Metadata } from "next";
import MarketplacePageClient from "./marketplace-page-client";
import { canonical, buildSocialMetadata } from "@/lib/seo";

const title = "Marketplace";
const description = "Browse, buy, and license digital assets on the Medialane marketplace. Gasless trading onchain.";

export const metadata: Metadata = {
  title,
  description,
  alternates: canonical("/marketplace"),
  ...buildSocialMetadata({ title, description, imageAlt: "Medialane Marketplace" }),
};

export default function MarketplacePage() {
  return <MarketplacePageClient />;
}
