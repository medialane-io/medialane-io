import type { Metadata } from "next";
import { canonical } from "@/lib/seo";
import Content from "@/components/settings/pages/appearance-page";
import { msg } from "@medialane/ui/i18n";

export const metadata: Metadata = {
  title: msg("Avatar & Theme — Settings"),
  alternates: canonical("/settings/appearance"),
  robots: { index: false, follow: false },
};

export default function Page() {
  return <Content />;
}
