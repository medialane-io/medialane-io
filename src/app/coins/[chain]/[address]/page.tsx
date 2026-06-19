import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { chainFromSlug } from "@/lib/routes";
import { CoinExploreClient } from "./coin-explore-client";

export const metadata: Metadata = {
  title: "Coin",
  description: "Explore a creator coin on Medialane.",
};

interface Props {
  params: Promise<{ chain: string; address: string }>;
}

export default async function CoinExplorePage({ params }: Props) {
  const { chain, address } = await params;
  if (!chainFromSlug(chain)) notFound();
  return <CoinExploreClient address={address} />;
}
