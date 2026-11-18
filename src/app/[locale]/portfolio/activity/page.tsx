"use client";

import { useWalletNativeSession } from "@/hooks/use-wallet-native-session";
import { PortfolioActivity } from "@medialane/ui";

export default function PortfolioActivityPage() {
  const { address: walletAddress } = useWalletNativeSession();
  return <PortfolioActivity address={walletAddress ?? null} />;
}
