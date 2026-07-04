import type { Metadata } from "next";
import { PopContent } from "./pop-content";
import { canonical, buildSocialMetadata } from "@/lib/seo";

const title = "Proof of Participation";
const description = "Claim your on-chain credential for events, bootcamps, and workshops.";

export const metadata: Metadata = {
  title,
  description,
  alternates: canonical("/launchpad/pop"),
  ...buildSocialMetadata({ title, description }),
};

export default function PopPage() {
  return <PopContent />;
}
