import type { Metadata } from "next";
import { canonical } from "@/lib/seo";
import Content from "@/components/settings/pages/wallet-page";
import { msg } from "@medialane/ui/i18n";

export const metadata: Metadata = {
  title: msg("Wallet — Settings"),
  alternates: canonical("/settings/wallet"),
  robots: { index: false, follow: false },
};

export default function Page() {
  return <Content />;
}
