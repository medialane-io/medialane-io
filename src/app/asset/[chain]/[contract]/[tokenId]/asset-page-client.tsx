"use client";

import { useParams } from "next/navigation";
import { AssetPage } from "@medialane/ui";
import { useAssetMarketActions } from "./asset-marketplace-dialogs";

export default function AssetPageClient() {
  const { contract, tokenId } = useParams<{ contract: string; tokenId: string }>();
  return <AssetPage contract={contract} tokenId={tokenId} useMarketActions={useAssetMarketActions} />;
}
