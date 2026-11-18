import { pageMetadata } from "@/lib/seo";
import Content from "@/components/settings/pages/profile-page";
import { msg } from "@medialane/ui/i18n";

export const generateMetadata = pageMetadata({
  path: "/settings/profile",
  title: msg("Profile — Settings"),
  robots: { index: false, follow: false },
  social: false,
});

export default function Page() {
  return <Content />;
}
