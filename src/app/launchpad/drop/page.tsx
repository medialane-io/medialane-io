import type { Metadata } from "next";
import { DropContent } from "./drop-content";
import { canonical, buildSocialMetadata } from "@/lib/seo";

const title = "Collection Drop";
const description = "Mint limited edition drops. Set your supply cap, open a mint window, and let your community collect.";

export const metadata: Metadata = {
  title,
  description,
  alternates: canonical("/launchpad/drop"),
  ...buildSocialMetadata({ title, description }),
};

export default function DropPage() {
  return <DropContent />;
}
