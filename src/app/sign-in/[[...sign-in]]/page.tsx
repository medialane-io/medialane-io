import { redirect } from "next/navigation";

/**
 * Wallet-native has no separate "sign in" step — a wallet in localStorage
 * already IS being signed in. This route only exists so old bookmarked/
 * shared /sign-in links still land somewhere useful.
 */
export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect_url?: string }>;
}) {
  const { redirect_url } = await searchParams;
  redirect(`/wallet-onboarding${redirect_url ? `?redirect_url=${encodeURIComponent(redirect_url)}` : ""}`);
}
