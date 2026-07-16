import type { Metadata } from "next";
import { SingleEditionsContent } from "./single-editions-content";
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
  return <SingleEditionsContent />;
}
