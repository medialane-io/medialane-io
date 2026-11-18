import type { Metadata } from "next";
import { HomePage } from "@/components/home";
import { canonical, buildSocialMetadata } from "@/lib/seo";
import { fetchFeaturedCollections } from "@/lib/api-server";

const title = "Medialane — Creator Launchpad + NFT Marketplace";
const description =
  "Mint, license, and trade intellectual property as NFTs on Starknet, with a self-custody passkey wallet and programmable royalties.";

export const metadata: Metadata = {
  title,
  description,
  alternates: canonical("/"),
  ...buildSocialMetadata({ title, description, imageAlt: "Medialane" }),
};

export const revalidate = 60;

export default async function Page() {
  const featured = await fetchFeaturedCollections(3);
  return <HomePage initialFeatured={featured ?? undefined} />;
}
