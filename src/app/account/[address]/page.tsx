import type { Metadata } from "next";
import CreatorPageClient from "./creator-page-client";

export const revalidate = 60;

interface Props {
  params: Promise<{ address: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { address } = await params;
  const short = `${address.slice(0, 8)}…${address.slice(-6)}`;
  const title = `${short} | Profile`;
  const description = `View IP assets, listings, and onchain activity for ${short} on Medialane.`;

  return {
    title,
    description,
    openGraph: { title: `${title} | Medialane`, description },
    twitter: { card: "summary", title: `${title} | Medialane`, description },
  };
}

export default function AccountPage() {
  return <CreatorPageClient />;
}
