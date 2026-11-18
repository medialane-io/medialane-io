import { redirect } from "next/navigation";
import { withLocale } from "@medialane/ui/i18n";

export default async function SignUpPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ redirect_url?: string }>;
}) {
  const { locale } = await params;
  const { redirect_url } = await searchParams;
  redirect(withLocale(`/connect${redirect_url ? `?redirect_url=${encodeURIComponent(redirect_url)}` : ""}`, locale));
}
