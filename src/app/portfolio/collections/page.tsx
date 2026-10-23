"use client";

import { PortfolioCollections } from "@medialane/ui";
import { ClaimCollectionPanel } from "@/components/claim/claim-collection-panel";

export default function PortfolioCollectionsPage() {
  return <PortfolioCollections claimPanel={<ClaimCollectionPanel />} />;
}
