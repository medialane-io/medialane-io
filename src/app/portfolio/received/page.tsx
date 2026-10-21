"use client";

import { PortfolioOrders, useMedialaneApp } from "@medialane/ui";
import { useReceivedOfferActions } from "@/components/portfolio/portfolio-actions";

export default function PortfolioReceivedPage() {
  const { walletAddress } = useMedialaneApp();
  return walletAddress ? <PortfolioOrders view="received" address={walletAddress} useActions={useReceivedOfferActions} /> : null;
}
