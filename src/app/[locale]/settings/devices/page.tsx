import { pageMetadata } from "@/lib/seo";
import Content from "@/components/settings/pages/devices-page";
import { msg } from "@medialane/ui/i18n";

export const generateMetadata = pageMetadata({
  path: "/settings/devices",
  title: msg("Devices — Settings"),
  robots: { index: false, follow: false },
  social: false,
});

export default function Page() {
  return <Content />;
}
