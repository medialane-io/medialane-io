import type { Metadata } from "next";
import { ClaimPageClient } from "./claim-page-client";
import { canonical, buildSocialMetadata } from "@/lib/seo";

const title = "Claims";
const description = "Reserve your username, bring in a collection or a coin, or join the Creator's Airdrop on Medialane.";

export const metadata: Metadata = {
  title,
  description,
  alternates: canonical("/claim"),
  ...buildSocialMetadata({ title, description }),
};

export default function ClaimPage() {
  return <ClaimPageClient />;
}
