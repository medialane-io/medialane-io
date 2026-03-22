import type { Metadata } from "next";
import { DiscoverPage } from "@/components/discover";

export const metadata: Metadata = {
  title: "Discover",
  description: "Explore trending IP assets, collections, and creators on Medialane — the Starknet creator launchpad.",
  openGraph: {
    title: "Discover | Medialane",
    description: "Explore trending IP assets, collections, and creators on Medialane — the Starknet creator launchpad.",
    images: [{ url: "/og-image.jpg", width: 1200, height: 630, alt: "Discover on Medialane" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Discover | Medialane",
    description: "Explore trending IP assets, collections, and creators on Medialane.",
    images: ["/og-image.jpg"],
  },
};

export default function DiscoverPreviewPage() {
  return <DiscoverPage />;
}
