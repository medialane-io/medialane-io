"use client";

import { PortfolioActivity as PortfolioActivityBase } from "@medialane/ui";
import { getMedialaneClient } from "@/lib/medialane-client";

export function PortfolioActivity({ address }: { address: string | null }) {
  return <PortfolioActivityBase getClient={getMedialaneClient} address={address} />;
}
