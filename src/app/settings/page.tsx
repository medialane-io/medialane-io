import { Suspense } from "react";
import type { Metadata } from "next";
import { canonical, buildSocialMetadata } from "@/lib/seo";
import SettingsContent from "./settings-content";

const title = "Account Settings";
const description = "Manage your public creator identity, username, and account.";

export const metadata: Metadata = {
  title,
  description,
  alternates: canonical("/settings"),
  ...buildSocialMetadata({ title, description }),
};

export default function SettingsPage() {
  return (
    <Suspense fallback={null}>
      <SettingsContent />
    </Suspense>
  );
}
