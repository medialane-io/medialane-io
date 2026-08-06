import { redirect } from "next/navigation";

/**
 * Wallet-native onboarding IS sign-up — there's no separate account step.
 * This route only exists so old bookmarked/shared /sign-up links still
 * land somewhere useful.
 */
export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect_url?: string }>;
}) {
  const { redirect_url } = await searchParams;
  redirect(`/wallet-onboarding${redirect_url ? `?redirect_url=${encodeURIComponent(redirect_url)}` : ""}`);
}
