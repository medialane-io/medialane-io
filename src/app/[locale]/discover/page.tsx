import type { Metadata } from "next";
import { DiscoverPage } from "@/components/discover";
import { canonical, buildSocialMetadata } from "@/lib/seo";

const title = "Discover";
const description = "Explore trending digital assets, collections, and creators on Medialane — Creator Launchpad + NFT Marketplace.";

export const metadata: Metadata = {
  title,
  description,
  alternates: canonical("/discover"),
  ...buildSocialMetadata({ title, description, imageAlt: "Discover on Medialane" }),
};

export default function DiscoverPreviewPage() {
  return <DiscoverPage />;
}
