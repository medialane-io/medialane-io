import type { Metadata } from "next";
import MarketplacePageClient from "./marketplace-page-client";

export const metadata: Metadata = {
  title: "Marketplace",
  description: "Browse, buy, and license IP assets on the Medialane marketplace. Gasless trading on Starknet.",
  openGraph: {
    title: "Marketplace | Medialane",
    description: "Browse, buy, and license IP assets on the Medialane marketplace. Gasless trading on Starknet.",
    images: [{ url: "/og-image.jpg", width: 1200, height: 630, alt: "Medialane Marketplace" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Marketplace | Medialane",
    description: "Browse, buy, and license IP assets on the Medialane marketplace.",
    images: ["/og-image.jpg"],
  },
};

export default function MarketplacePage() {
  return <MarketplacePageClient />;
}
