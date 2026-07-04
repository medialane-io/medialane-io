import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { JsonLd } from "@/components/seo/json-ld";
import { fetchCreatorProfile, ipfsToHttpServer } from "@/lib/api-server";
import { absoluteUrl, canonical, truncateDescription, buildSocialMetadata, buildBreadcrumbJsonLd } from "@/lib/seo";
import CreatorUsernamePageClient from "./creator-username-client";

export const revalidate = 60;

interface Props {
  params: Promise<{ address: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { address } = await params;

  // Wallet addresses redirect server-side — metadata will be picked up by /account/[address]
  if (address.startsWith("0x") || address.startsWith("0X")) {
    return { title: `${address.slice(0, 8)}… | Medialane` };
  }

  const profile = await fetchCreatorProfile(address);
  const name = profile?.displayName ?? profile?.username ?? `@${address}`;
  const bio = profile?.bio ?? `Creator profile for ${name} on Medialane.`;
  const description = truncateDescription(bio);
  const path = `/creator/${address}`;
  const rawImage = profile?.avatarImage || profile?.bannerImage;
  const imageUrl = rawImage ? ipfsToHttpServer(rawImage) : undefined;
  const social = buildSocialMetadata({ title: name, description, imageUrl, imageAlt: name });

  return {
    title: name,
    description,
    alternates: canonical(path),
    ...social,
    openGraph: { ...social.openGraph, type: "profile" },
  };
}

export default async function CreatorPage({ params }: Props) {
  const { address } = await params;

  // Wallet addresses start with 0x — redirect them to /account/[address]
  // to keep /creator/[slug] exclusively for username-based profiles.
  if (address.startsWith("0x") || address.startsWith("0X")) {
    redirect(`/account/${address}`);
  }

  const profile = await fetchCreatorProfile(address);
  const name = profile?.displayName ?? profile?.username ?? `@${address}`;
  const bio = profile?.bio ?? `Creator profile for ${name} on Medialane.`;
  const path = `/creator/${address}`;
  const image = ipfsToHttpServer(profile?.avatarImage || profile?.bannerImage || "");
  const sameAs = [profile?.websiteUrl, profile?.twitterUrl].filter(Boolean);

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "ProfilePage",
      name: `${name} | Medialane`,
      url: absoluteUrl(path),
      mainEntity: {
        "@type": "Person",
        name,
        description: bio,
        url: absoluteUrl(path),
        ...(image && { image }),
        ...(sameAs.length > 0 && { sameAs }),
      },
    },
    buildBreadcrumbJsonLd([
      { name: "Creators", path: "/creators" },
      { name, path },
    ]),
  ];

  // Otherwise treat as a username slug
  return (
    <>
      <JsonLd data={jsonLd} />
      <CreatorUsernamePageClient username={address} />
    </>
  );
}
