"use client";

import { useParams } from "next/navigation";
import { AccountPage } from "@medialane/ui";
import { useAssetActions } from "@/components/portfolio/portfolio-actions";
import { useMarketActions } from "@/lib/use-market-actions";

export default function AccountPageClient() {
  const { address } = useParams<{ address: string }>();
  return <AccountPage address={address} useAssetActions={useAssetActions} useMarketActions={useMarketActions} />;
}
