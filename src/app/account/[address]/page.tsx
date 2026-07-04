import type { Metadata } from "next";
import { canonical, buildSocialMetadata, buildBreadcrumbJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/seo/json-ld";
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
    ...buildSocialMetadata({ title, description }),
  };
}

export default async function AccountPage({ params }: Props) {
  const { address } = await params;
  const short = `${address.slice(0, 8)}…${address.slice(-6)}`;

  const jsonLd = buildBreadcrumbJsonLd([
    { name: "Creators", path: "/creators" },
    { name: short, path: `/account/${address}` },
  ]);

  return (
    <>
      <JsonLd data={jsonLd} />
      <CreatorPageClient />
    </>
  );
}
