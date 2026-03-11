import type { Metadata } from "next";
import { DiscoverPage } from "@/components/discover";

export const metadata: Metadata = {
  title: "Discover",
  description: "Explore trending IP assets, collections, and creators on Medialane — the Starknet creator launchpad.",
};

export default function DiscoverPreviewPage() {
  return <DiscoverPage />;
}
