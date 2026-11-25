"use client";

import { use } from "react";
import { TierMintForm, CLUB_TIER_PRESET } from "@medialane/ui";
import { CreateAside } from "@medialane/ui/create-aside";

export default function CreateMembershipPage({ params }: { params: Promise<{ contract: string }> }) {
  const { contract } = use(params);
  return <TierMintForm contract={contract} preset={CLUB_TIER_PRESET} aside={<CreateAside kind="club" />} />;
}
