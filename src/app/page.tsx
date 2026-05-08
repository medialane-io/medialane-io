import type { Metadata } from "next";
import { HomePage } from "@/components/home";
import { canonical } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Medialane — Creator Launchpad + NFT Marketplace",
  description:
    "Mint, license, and trade intellectual property as NFTs on Starknet. Free to mint. Gas-free trading. Programmable royalties.",
  alternates: canonical("/"),
  openGraph: {
    title: "Medialane — Creator Launchpad + NFT Marketplace",
    description:
      "Mint, license, and trade intellectual property as NFTs on Starknet. Free to mint. Gas-free trading. Programmable royalties.",
    type: "website",
    url: "/",
  },
};

export default function Page() {
  return <HomePage />;
}
