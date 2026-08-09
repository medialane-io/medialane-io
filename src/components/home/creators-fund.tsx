"use client";

import { CreatorsFundSection } from "@medialane/ui";
import { useLeaderboard } from "@/hooks/use-rewards";

export function CreatorsFund() {
  const { data, isLoading } = useLeaderboard(1, 5);

  return (
    <CreatorsFundSection
      airdropHref="/airdrop"
      rewardsHref="/rewards"
      entries={data?.data ?? []}
      isLoading={isLoading}
      creatorHref={(address) => `/account/${address}`}
    />
  );
}
