import type { Metadata } from "next";
import CollectionsPageClient from "./collections-page-client";

export const metadata: Metadata = {
  title: "Collections",
  description: "Browse all onchain IP collections on Medialane — NFT, art, audio, video, and more on Starknet.",
  openGraph: {
    title: "Collections | Medialane",
    description: "Browse all onchain IP collections on Medialane — NFT, art, audio, video, and more on Starknet.",
    images: [{ url: "/og-image.jpg", width: 1200, height: 630, alt: "Medialane Collections" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Collections | Medialane",
    description: "Browse all onchain IP collections on Medialane.",
    images: ["/og-image.jpg"],
  },
};

export default function CollectionsPage() {
  return <CollectionsPageClient />;
}
