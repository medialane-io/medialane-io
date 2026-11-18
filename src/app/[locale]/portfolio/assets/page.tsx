"use client";

import { PortfolioAssets, useMedialaneApp } from "@medialane/ui";
import { useAssetActions } from "@/components/portfolio/portfolio-actions";

export default function PortfolioAssetsPage() {
  const { walletAddress } = useMedialaneApp();
  return walletAddress ? <PortfolioAssets key={walletAddress} address={walletAddress} useActions={useAssetActions} /> : null;
}
