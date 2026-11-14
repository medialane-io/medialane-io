import type { Metadata } from "next";
import { AccountsPage as AccountsPageClient } from "@medialane/ui";
import { canonical, buildSocialMetadata } from "@/lib/seo";

const title = "Accounts";
const description = "Browse onchain accounts on Medialane: every address with collections or assets.";

export const metadata: Metadata = {
  title,
  description,
  alternates: canonical("/creators"),
  ...buildSocialMetadata({ title, description, imageAlt: "Medialane Accounts" }),
};

export default function AccountsPage() {
  return <AccountsPageClient />;
}
