import type { Metadata } from "next";
import { IP1155Content } from "./nfteditions-content";
import { canonical, buildSocialMetadata } from "@/lib/seo";

const title = "Limited Editions | Launchpad";
const description = "Mint numbered copies of your work into an editions collection you own, or create a new collection.";

export const metadata: Metadata = {
  title,
  description,
  alternates: canonical("/launchpad/nfteditions"),
  ...buildSocialMetadata({ title, description }),
};

export default function NFTEditionsPage() {
  return <IP1155Content />;
}
