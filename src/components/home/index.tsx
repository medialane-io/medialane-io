"use client";

import { HomePage as SharedHomePage } from "@medialane/ui";
import type { ApiCollection } from "@medialane/sdk";
import { useMarketActions } from "@/lib/use-market-actions";

export function HomePage({ initialFeatured }: { initialFeatured?: ApiCollection[] }) {
  return <SharedHomePage useMarketActions={useMarketActions} initialFeatured={initialFeatured} />;
}
