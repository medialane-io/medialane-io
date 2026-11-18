"use client";

import { PortfolioShell as SharedPortfolioShell, useRemixOffers } from "@medialane/ui";

export function PortfolioShell({ children }: { children: React.ReactNode }) {
  const { offers, isLoading } = useRemixOffers("creator");
  const { offers: requests, isLoading: requestsLoading } = useRemixOffers("requester");
  const licensing = { present: offers.length + requests.length > 0, isLoading: isLoading || requestsLoading };
  return <SharedPortfolioShell remixOffers={offers} licensing={licensing}>{children}</SharedPortfolioShell>;
}
