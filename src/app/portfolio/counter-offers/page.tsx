"use client";

import { useWalletNativeSession } from "@/hooks/use-wallet-native-session";
import { CounterOffersTable } from "@/components/portfolio/counter-offers-table";

export default function PortfolioCounterOffersPage() {
  const { address: walletAddress } = useWalletNativeSession();
  return <CounterOffersTable address={walletAddress!} />;
}
