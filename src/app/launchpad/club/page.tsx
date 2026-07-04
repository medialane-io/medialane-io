import type { Metadata } from "next";
import { ClubContent } from "./club-content";
import { canonical, buildSocialMetadata } from "@/lib/seo";

const title = "IP Club";
const description = "Membership clubs with an on-chain NFT membership card.";

export const metadata: Metadata = {
  title,
  description,
  alternates: canonical("/launchpad/club"),
  ...buildSocialMetadata({ title, description }),
};

export default function ClubPage() {
  return <ClubContent />;
}
