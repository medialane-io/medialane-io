import type { Metadata } from "next";
import { IP1155Content } from "./nfteditions-content";
import { canonical, buildSocialMetadata } from "@/lib/seo";

const title = "NFT Editions | Launchpad";
const description = "Manage your multi-edition NFT collections — mint new token editions or deploy a new collection.";

export const metadata: Metadata = {
  title,
  description,
  alternates: canonical("/launchpad/nfteditions"),
  ...buildSocialMetadata({ title, description }),
};

export default function NFTEditionsPage() {
  return <IP1155Content />;
}
