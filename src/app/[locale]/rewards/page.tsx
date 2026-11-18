import type { Metadata } from "next";
import { RewardsPage } from "@medialane/ui";
import { canonical, buildSocialMetadata } from "@/lib/seo";

const title = "Rewards";
const description =
  "What Medialane gives back to everyone creating, collecting, and taking part.";

export const metadata: Metadata = {
  title,
  description,
  alternates: canonical("/rewards"),
  ...buildSocialMetadata({ title, description }),
};

export default RewardsPage;
