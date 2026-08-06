"use client";

import { useWalletNativeSession } from "@/hooks/use-wallet-native-session";
import { OffersTable } from "@/components/portfolio/offers-table";

export default function PortfolioOffersPage() {
  const { address: walletAddress } = useWalletNativeSession();
  return <OffersTable address={walletAddress!} />;
}
