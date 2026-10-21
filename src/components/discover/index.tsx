"use client";

import { DiscoverPage as SharedDiscoverPage } from "@medialane/ui";
import { useMarketActions } from "@/lib/use-market-actions";

export function DiscoverPage() {
  return <SharedDiscoverPage useMarketActions={useMarketActions} heroHeadline="Explore, share & trade" />;
}
