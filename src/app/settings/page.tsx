import type { Metadata } from "next";
import { PageContainer } from "@medialane/ui";
import { canonical, buildSocialMetadata } from "@/lib/seo";
import SettingsContent from "./settings-content";

const title = "Account Settings";
const description = "Manage your public creator identity, username, and wallet connection.";

export const metadata: Metadata = {
  title,
  description,
  alternates: canonical("/settings"),
  ...buildSocialMetadata({ title, description }),
};

export default function SettingsPage() {
  return (
    <PageContainer className="box-border max-w-full pt-20 pb-16">
      <SettingsContent />
    </PageContainer>
  );
}
