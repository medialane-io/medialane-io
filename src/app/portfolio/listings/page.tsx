"use client";

import { useWalletNativeSession } from "@/hooks/use-wallet-native-session";
import { ListingsTable } from "@/components/portfolio/listings-table";

export default function PortfolioListingsPage() {
  const { address: walletAddress } = useWalletNativeSession();
  return <ListingsTable address={walletAddress!} />;
}
