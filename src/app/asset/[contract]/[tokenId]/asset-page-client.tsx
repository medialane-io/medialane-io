"use client";

import { useParams } from "next/navigation";
import { useToken } from "@/hooks/use-tokens";
import { useCollection } from "@/hooks/use-collections";
import { Skeleton } from "@/components/ui/skeleton";
import { AssetPageStandard } from "./asset-page-standard";
import { AssetPagePop } from "./asset-page-pop";
import { AssetPageDrop } from "./asset-page-drop";
import { AssetPageEdition } from "./asset-page-edition";

function detectAssetType(
  source: string | undefined,
  standard: string | undefined
): "pop" | "drop" | "edition" | "standard" {
  if (source === "POP_PROTOCOL") return "pop";
  if (source === "COLLECTION_DROP") return "drop";
  if (standard === "ERC1155") return "edition";
  return "standard";
}

export default function AssetPageClient() {
  const { contract, tokenId } = useParams<{ contract: string; tokenId: string }>();
  const { token, isLoading: tokenLoading } = useToken(contract, tokenId);
  const { collection, isLoading: collectionLoading } = useCollection(contract);

  if (tokenLoading || collectionLoading) {
    return (
      <div className="container mx-auto px-4 pt-14 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] lg:gap-10 gap-8">
          <Skeleton className="aspect-[4/3] w-full rounded-2xl" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </div>
    );
  }

  const assetType = detectAssetType(collection?.source, collection?.standard ?? token?.standard);

  if (assetType === "pop") return <AssetPagePop />;
  if (assetType === "drop") return <AssetPageDrop />;
  if (assetType === "edition") return <AssetPageEdition />;
  return <AssetPageStandard />;
}
