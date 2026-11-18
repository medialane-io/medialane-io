import { pageMetadata } from "@/lib/seo";
import Content from "@/components/settings/pages/wallet-page";
import { msg } from "@medialane/ui/i18n";

export const generateMetadata = pageMetadata({
  path: "/settings/wallet",
  title: msg("Wallet — Settings"),
  robots: { index: false, follow: false },
  social: false,
});

export default function Page() {
  return <Content />;
}
