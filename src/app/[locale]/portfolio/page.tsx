import { redirect } from "next/navigation";
import { withLocale } from "@medialane/ui/i18n";

export default async function PortfolioPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  redirect(withLocale("/portfolio/assets", locale));
}
