import { redirect } from "next/navigation";

/**
 * Wallet-native has no separate "sign in" step for a device that already
 * has a wallet — a local key is already being signed in automatically. For
 * every other device, /connect (email + code) is how a walletless-so-far
 * account gets back in. This route only exists so old bookmarked/shared
 * /sign-in links still land somewhere useful.
 */
export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect_url?: string }>;
}) {
  const { redirect_url } = await searchParams;
  redirect(`/connect${redirect_url ? `?redirect_url=${encodeURIComponent(redirect_url)}` : ""}`);
}
