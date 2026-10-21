"use client";

import { PortfolioOrders, useMedialaneApp } from "@medialane/ui";
import { useListingActions } from "@/components/portfolio/portfolio-actions";

export default function PortfolioListingsPage() {
  const { walletAddress } = useMedialaneApp();
  return walletAddress ? <PortfolioOrders view="listings" address={walletAddress} useActions={useListingActions} /> : null;
}
