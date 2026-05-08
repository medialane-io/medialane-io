import type { Metadata } from "next";
import { IP1155Content } from "./nfteditions-content";
import { canonical } from "@/lib/seo";

export const metadata: Metadata = {
  title: "NFT Editions | Launchpad | Medialane",
  description: "Manage your multi-edition NFT collections — mint new token editions or deploy a new collection.",
  alternates: canonical("/launchpad/nfteditions"),
};

export default function NFTEditionsPage() {
  return <IP1155Content />;
}
