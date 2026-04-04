import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { fetchCreatorProfile } from "@/lib/api-server";
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

  return {
    title: name,
    description: bio.length > 160 ? `${bio.slice(0, 157)}…` : bio,
    openGraph: {
      title: `${name} | Medialane`,
      description: bio.length > 160 ? `${bio.slice(0, 157)}…` : bio,
      type: "profile",
    },
    twitter: {
      card: "summary_large_image",
      title: `${name} | Medialane`,
      description: bio.length > 160 ? `${bio.slice(0, 157)}…` : bio,
    },
  };
}

export default async function CreatorPage({ params }: Props) {
  const { address } = await params;

  // Wallet addresses start with 0x — redirect them to /account/[address]
  // to keep /creator/[slug] exclusively for username-based profiles.
  if (address.startsWith("0x") || address.startsWith("0X")) {
    redirect(`/account/${address}`);
  }

  // Otherwise treat as a username slug
  return <CreatorUsernamePageClient username={address} />;
}
