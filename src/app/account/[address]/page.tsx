import type { Metadata } from "next";
import { canonical } from "@/lib/seo";
import CreatorPageClient from "./creator-page-client";

export const revalidate = 60;

interface Props {
  params: Promise<{ address: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { address } = await params;
  const short = `${address.slice(0, 8)}…${address.slice(-6)}`;
  const title = `${short} | Profile`;
  const description = `View digital assets, listings, and onchain activity for ${short} on Medialane.`;

  return {
    title,
    description,
    alternates: canonical(`/account/${address}`),
    openGraph: {
      title: `${title} | Medialane`,
      description,
      url: `/account/${address}`,
      images: [{ url: "/og-image.jpg", width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | Medialane`,
      description,
      images: ["/og-image.jpg"],
    },
  };
}

export default function AccountPage() {
  return <CreatorPageClient />;
}
