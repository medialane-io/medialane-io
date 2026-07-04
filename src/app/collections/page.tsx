import type { Metadata } from "next";
import CollectionsPageClient from "./collections-page-client";
import { canonical, buildSocialMetadata } from "@/lib/seo";

const title = "Collections";
const description = "Browse all onchain IP collections on Medialane — NFT, art, audio, video, and more on Starknet.";

export const metadata: Metadata = {
  title,
  description,
  alternates: canonical("/collections"),
  ...buildSocialMetadata({ title, description, imageAlt: "Medialane Collections" }),
};

export default function CollectionsPage() {
  return <CollectionsPageClient />;
}
