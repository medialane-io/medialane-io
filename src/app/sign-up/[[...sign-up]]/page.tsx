import { redirect } from "next/navigation";

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect_url?: string }>;
}) {
  const { redirect_url } = await searchParams;
  redirect(`/connect${redirect_url ? `?redirect_url=${encodeURIComponent(redirect_url)}` : ""}`);
}
