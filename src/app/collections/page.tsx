import type { Metadata } from "next";
import CollectionsPageClient from "./collections-page-client";
import { canonical } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Collections",
  description: "Browse all onchain IP collections on Medialane — NFT, art, audio, video, and more on Starknet.",
  alternates: canonical("/collections"),
  openGraph: {
    title: "Collections | Medialane",
    description: "Browse all onchain IP collections on Medialane — NFT, art, audio, video, and more on Starknet.",
    url: "/collections",
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
