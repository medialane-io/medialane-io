import type { Metadata } from "next";
import { CoinExploreClient } from "./coin-explore-client";

export const metadata: Metadata = {
  title: "Coin",
  description: "Explore a creator coin on Medialane.",
};

interface Props {
  params: Promise<{ address: string }>;
}

export default async function CoinExplorePage({ params }: Props) {
  const { address } = await params;
  return <CoinExploreClient address={address} />;
}
