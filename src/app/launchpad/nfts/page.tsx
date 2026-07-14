import type { Metadata } from "next";
import { NFTsContent } from "./nfts-content";
import { canonical, buildSocialMetadata } from "@/lib/seo";

const title = "NFTs | Launchpad";
const description = "Mint one-of-a-kind works into a collection you own, or create a new collection.";

export const metadata: Metadata = {
  title,
  description,
  alternates: canonical("/launchpad/nfts"),
  ...buildSocialMetadata({ title, description }),
};

export default function NFTsPage() {
  return <NFTsContent />;
}
