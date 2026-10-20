"use client";

import { useParams } from "next/navigation";
import { AssetPage, type AssetPageSlots } from "@medialane/ui";
import { CommentsSection } from "@/components/asset/comments-section";
import { ReportDialog } from "@/components/report-dialog";
import { PopBurnButton } from "@/components/claim/pop-burn-button";
import { useAssetMarketActions } from "./asset-marketplace-dialogs";

const SLOTS: AssetPageSlots = {
  useMarketActions: useAssetMarketActions,
  Comments: CommentsSection,
  Report: ReportDialog,
  PopBurn: PopBurnButton,
};

export default function AssetPageClient() {
  const { contract, tokenId } = useParams<{ contract: string; tokenId: string }>();
  return <AssetPage contract={contract} tokenId={tokenId} slots={SLOTS} />;
}
