"use client";

import { PortfolioOrders, useMedialaneApp } from "@medialane/ui";
import { useOfferActions } from "@/components/portfolio/portfolio-actions";

export default function PortfolioOffersPage() {
  const { walletAddress } = useMedialaneApp();
  return walletAddress ? <PortfolioOrders view="offers" address={walletAddress} useActions={useOfferActions} /> : null;
}
