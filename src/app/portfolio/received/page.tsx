"use client";

import { useSessionKey } from "@/hooks/use-session-key";
import { ReceivedOffersTable } from "@/components/portfolio/received-offers-table";

export default function PortfolioReceivedPage() {
  const { walletAddress } = useSessionKey();
  return <ReceivedOffersTable address={walletAddress!} />;
}
