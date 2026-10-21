"use client";

import { useParams } from "next/navigation";
import { CreatorPage } from "@medialane/ui";
import { useAssetActions } from "@/components/portfolio/portfolio-actions";
import { useMarketActions } from "@/lib/use-market-actions";

export default function CreatorPageClient() {
  const { address } = useParams<{ address: string }>();
  return <CreatorPage address={address} useAssetActions={useAssetActions} useMarketActions={useMarketActions} />;
}
