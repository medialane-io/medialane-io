"use client";

import { PortfolioShell as SharedPortfolioShell } from "@medialane/ui";
import { useRemixOffers } from "@/hooks/use-remix-offers";

export function PortfolioShell({ children }: { children: React.ReactNode }) {
  const { offers } = useRemixOffers("creator");
  return <SharedPortfolioShell remixOffers={offers}>{children}</SharedPortfolioShell>;
}
