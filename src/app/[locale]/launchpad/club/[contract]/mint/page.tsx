"use client";

import { use } from "react";
import { TierMintForm, CLUB_TIER_PRESET } from "@medialane/ui";
import { PageAside } from "@/components/claim/page-aside";

export default function CreateMembershipPage({ params }: { params: Promise<{ contract: string }> }) {
  const { contract } = use(params);
  return <TierMintForm contract={contract} preset={CLUB_TIER_PRESET} aside={<PageAside kind="club" />} />;
}
