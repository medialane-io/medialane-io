import type { Metadata } from "next";
import { HomePage } from "@/components/home";
import { canonical, buildSocialMetadata } from "@/lib/seo";

const title = "Medialane — Creator Launchpad + NFT Marketplace";
const description =
  "Mint, license, and trade intellectual property as NFTs on Starknet. Self-custody wallet, no seed phrase. Programmable royalties.";

export const metadata: Metadata = {
  title,
  description,
  alternates: canonical("/"),
  ...buildSocialMetadata({ title, description, imageAlt: "Medialane" }),
};

export default function Page() {
  return <HomePage />;
}
