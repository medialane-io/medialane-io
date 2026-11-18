import { redirect } from "next/navigation";
import { withLocale, msg } from "@medialane/ui/i18n";
import { pageMetadata } from "@/lib/seo";
import { legacySettingsPath } from "@/lib/settings/rows";
import SettingsHomePage from "@/components/settings/pages/home-page";

const title = msg("Account settings");
const description = msg("Manage your public creator identity, username, and account.");

export const generateMetadata = pageMetadata({
  path: "/settings",
  title,
  description,
});

export default async function SettingsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { locale } = await params;
  const legacy = legacySettingsPath((await searchParams).tab);
  if (legacy) redirect(withLocale(legacy, locale));
  return <SettingsHomePage />;
}
