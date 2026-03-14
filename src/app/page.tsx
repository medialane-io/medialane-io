import type { Metadata } from "next";
import { HomePage } from "@/components/home";

export const metadata: Metadata = {
  title: "Medialane — The Starknet Creator Launchpad",
  description:
    "Mint, license, and trade intellectual property as NFTs on Starknet. Free to mint. Gas-free trading. Programmable royalties.",
  openGraph: {
    title: "Medialane — The Starknet Creator Launchpad",
    description:
      "Mint, license, and trade intellectual property as NFTs on Starknet. Free to mint. Gas-free trading. Programmable royalties.",
    type: "website",
  },
};

export default function Page() {
  return <HomePage />;
}
