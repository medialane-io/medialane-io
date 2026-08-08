import { redirect } from "next/navigation";

/**
 * Superseded by /connect (account) + /wallet-onboarding (passkey-deployed
 * MediaWallet). Kept as a redirect so old links (emails, bookmarks,
 * campaign URLs already in the wild) keep working.
 */
export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect_url?: string }>;
}) {
  const { redirect_url } = await searchParams;
  redirect(`/connect${redirect_url ? `?redirect_url=${encodeURIComponent(redirect_url)}` : ""}`);
}
