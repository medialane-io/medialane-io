import type { Metadata } from "next";
import { SingleEditionsContent } from "./single-editions-content";
import { canonical, buildSocialMetadata } from "@/lib/seo";

const title = "Single Editions | Launchpad";
const description = "Publish each work as a single copy in a collection you own, or create a new collection.";

export const metadata: Metadata = {
  title,
  description,
  alternates: canonical("/launchpad/single-editions"),
  ...buildSocialMetadata({ title, description }),
};

export default function SingleEditionsPage() {
  return <SingleEditionsContent />;
}
