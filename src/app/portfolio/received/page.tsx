"use client";

import { useWalletNativeSession } from "@/hooks/use-wallet-native-session";
import { ReceivedOffersTable } from "@/components/portfolio/received-offers-table";

export default function PortfolioReceivedPage() {
  const { address: walletAddress } = useWalletNativeSession();
  return <ReceivedOffersTable address={walletAddress!} />;
}
