import type { Metadata } from "next";
import { LaunchpadContent } from "./launchpad-content";
import { canonical, buildSocialMetadata } from "@/lib/seo";

const title = "Launchpad";
const description = "Creator hub — launch drops, mint assets, and deploy collections on Medialane.";

export const metadata: Metadata = {
  title,
  description,
  alternates: canonical("/launchpad"),
  ...buildSocialMetadata({ title, description }),
};

export default function LaunchpadPage() {
  return <LaunchpadContent />;
}
