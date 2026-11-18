import type { Metadata } from "next";
import { ServiceCollectionsPage } from "@medialane/ui";
import { canonical, buildSocialMetadata } from "@/lib/seo";

const title = "IP Tickets";
const description = "Create verifiable on-chain tickets — mint to your audience, trade like any collection.";

export const metadata: Metadata = {
  title,
  description,
  alternates: canonical("/launchpad/tickets"),
  ...buildSocialMetadata({ title, description }),
};

export default function TicketsPage() {
  return <ServiceCollectionsPage kind="tickets" />;
}
