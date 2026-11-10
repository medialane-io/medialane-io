"use client";

import { useParams } from "next/navigation";
import { AssetPage } from "@medialane/ui";
import type { ApiCollection, ApiToken } from "@medialane/sdk";
import { useAssetMarketActions } from "./asset-marketplace-dialogs";

export default function AssetPageClient({
  initialToken,
  initialCollection,
}: {
  initialToken: ApiToken | null;
  initialCollection: ApiCollection | null;
}) {
  const { contract, tokenId } = useParams<{ contract: string; tokenId: string }>();
  return (
    <AssetPage
      contract={contract}
      tokenId={tokenId}
      initialToken={initialToken}
      initialCollection={initialCollection}
      useMarketActions={useAssetMarketActions}
    />
  );
}
