"use client";

import { CreatorPage } from "@medialane/ui";
import { useAssetActions } from "@/components/portfolio/portfolio-actions";
import { useMarketActions } from "@/lib/use-market-actions";

export default function CreatorUsernamePageClient({ username }: { username: string }) {
  return <CreatorPage username={username} useAssetActions={useAssetActions} useMarketActions={useMarketActions} />;
}
