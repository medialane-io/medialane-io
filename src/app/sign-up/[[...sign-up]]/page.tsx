import { redirect } from "next/navigation";

/**
 * /connect is the real account entry point. This route only exists so old
 * bookmarked/shared /sign-up links still land somewhere useful.
 */
export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect_url?: string }>;
}) {
  const { redirect_url } = await searchParams;
  redirect(`/connect${redirect_url ? `?redirect_url=${encodeURIComponent(redirect_url)}` : ""}`);
}
