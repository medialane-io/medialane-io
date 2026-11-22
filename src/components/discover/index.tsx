"use client";

import { DiscoverPage as SharedDiscoverPage } from "@medialane/ui";
import { useT } from "@medialane/ui/i18n";
import { useMarketActions } from "@/lib/use-market-actions";

export function DiscoverPage() {
  const t = useT();
  return <SharedDiscoverPage useMarketActions={useMarketActions} heroHeadline={t("Explore and trade")} />;
}
