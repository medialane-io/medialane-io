"use client";

import { use } from "react";
import { TierMintForm, TICKETS_TIER_PRESET } from "@medialane/ui";
import { CreateTicketAside } from "@/components/claim/create-ticket-aside";

export default function MintTicketPage({ params }: { params: Promise<{ contract: string }> }) {
  const { contract } = use(params);
  return <TierMintForm contract={contract} preset={TICKETS_TIER_PRESET} aside={<CreateTicketAside />} />;
}
