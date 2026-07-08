"use client";

import { CommunityRewardsSection } from "@medialane/ui";
import { useLeaderboard } from "@/hooks/use-rewards";

export function TopCreators() {
  const { data, isLoading } = useLeaderboard(1, 4);

  return (
    <CommunityRewardsSection
      entries={data?.data ?? []}
      isLoading={isLoading}
      rewardsHref="/rewards"
      creatorHref={(address) => `/account/${address}`}
    />
  );
}
