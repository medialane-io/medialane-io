import type { Metadata } from "next";
import { SingleEditionMint } from "@medialane/ui";
import { CreateAssetAside } from "@/components/claim/create-asset-aside";
import { canonical, buildSocialMetadata } from "@/lib/seo";

const title = "Mint NFT | Launchpad";
const description = "Publish your creative work as a single-copy NFT in a collection you own.";

export const metadata: Metadata = {
  title,
  description,
  alternates: canonical("/launchpad/single-editions"),
  ...buildSocialMetadata({ title, description }),
};

export default function SingleEditionsPage() {
  return <SingleEditionMint aside={<CreateAssetAside />} />;
}
