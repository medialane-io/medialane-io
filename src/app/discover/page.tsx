import type { Metadata } from "next";
import { DiscoverPage } from "@/components/discover";
import { canonical } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Discover",
  description: "Explore trending digital assets, collections, and creators on Medialane — Creator Launchpad + NFT Marketplace.",
  alternates: canonical("/discover"),
  openGraph: {
    title: "Discover | Medialane",
    description: "Explore trending digital assets, collections, and creators on Medialane — Creator Launchpad + NFT Marketplace.",
    url: "/discover",
    images: [{ url: "/og-image.jpg", width: 1200, height: 630, alt: "Discover on Medialane" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Discover | Medialane",
    description: "Explore trending digital assets, collections, and creators on Medialane.",
    images: ["/og-image.jpg"],
  },
};

export default function DiscoverPreviewPage() {
  return <DiscoverPage />;
}
