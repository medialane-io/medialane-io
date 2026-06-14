import type { Metadata } from "next";
import { CoinsMount } from "./coins-mount";

export const metadata: Metadata = {
  title: "Coins",
  description: "Discover creator coins and memecoins on Medialane.",
  openGraph: {
    title: "Coins | Medialane",
    description: "Discover creator coins and memecoins on Medialane.",
    url: "/coins",
    images: [{ url: "/og-image.jpg", width: 1200, height: 630, alt: "Medialane Coins" }],
  },
};

export default function CoinsPage() {
  return (
    <div className="container mx-auto max-w-full px-4 sm:px-6 lg:px-8 pt-20 pb-8">
      <CoinsMount />
    </div>
  );
}
