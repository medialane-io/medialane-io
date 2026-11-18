import type { Metadata } from "next";
import { canonical } from "@/lib/seo";
import Content from "@/components/settings/pages/devices-page";
import { msg } from "@medialane/ui/i18n";

export const metadata: Metadata = {
  title: msg("Devices — Settings"),
  alternates: canonical("/settings/devices"),
  robots: { index: false, follow: false },
};

export default function Page() {
  return <Content />;
}
