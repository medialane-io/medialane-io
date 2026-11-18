import type { Metadata } from "next";
import { canonical } from "@/lib/seo";
import Content from "@/components/settings/pages/profile-page";
import { msg } from "@medialane/ui/i18n";

export const metadata: Metadata = {
  title: msg("Profile — Settings"),
  alternates: canonical("/settings/profile"),
  robots: { index: false, follow: false },
};

export default function Page() {
  return <Content />;
}
