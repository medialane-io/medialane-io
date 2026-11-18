import { redirect } from "next/navigation";
import { withLocale } from "@medialane/ui/i18n";

export default async function CreatePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  redirect(withLocale("/launchpad", locale));
}
