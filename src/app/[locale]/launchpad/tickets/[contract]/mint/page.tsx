"use client";

import { use } from "react";
import { TierMintForm, TICKETS_TIER_PRESET } from "@medialane/ui";

export default function MintTicketPage({ params }: { params: Promise<{ contract: string }> }) {
  const { contract } = use(params);
  return <TierMintForm contract={contract} preset={TICKETS_TIER_PRESET} />;
}
