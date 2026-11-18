"use client";

import { IpTypePage } from "@medialane/ui";
import { useMarketActions } from "@/lib/use-market-actions";

export function IpTypePageClient({ slug }: { slug: string }) {
  return <IpTypePage slug={slug} useMarketActions={useMarketActions} />;
}
