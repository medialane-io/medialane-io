import type { Metadata } from "next";
import { SponsorshipContent } from "./sponsorship-content";
import { canonical, buildSocialMetadata } from "@/lib/seo";

const title = "IP Sponsorship";
const description = "Sponsorship offers and licenses anchored to Medialane assets.";

export const metadata: Metadata = {
  title,
  description,
  alternates: canonical("/launchpad/sponsorship"),
  ...buildSocialMetadata({ title, description }),
};

export default function SponsorshipPage() {
  return <SponsorshipContent />;
}
