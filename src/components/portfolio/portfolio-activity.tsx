"use client";

import { PortfolioActivity as PortfolioActivityBase } from "@medialane/ui";

export function PortfolioActivity({ address }: { address: string | null }) {
  return <PortfolioActivityBase address={address} />;
}
