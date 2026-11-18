import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { withLocale } from "@medialane/ui/i18n";
import { canonical, buildSocialMetadata } from "@/lib/seo";
import { legacySettingsPath } from "@/lib/settings/rows";
import SettingsHomePage from "@/components/settings/pages/home-page";

const title = "Account Settings";
const description = "Manage your public creator identity, username, and account.";

export const metadata: Metadata = {
  title,
  description,
  alternates: canonical("/settings"),
  ...buildSocialMetadata({ title, description }),
};

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
