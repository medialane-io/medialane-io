"use client";

import {
  useRewards as useRewardsBase,
  useLeaderboard as useLeaderboardBase,
  useRewardsEvents as useRewardsEventsBase,
  useRewardsConfig as useRewardsConfigBase,
  useRewardsBatch as useRewardsBatchBase,
} from "@medialane/ui";

export type { UserRewards, LeaderboardEntry, BadgeSummary, LevelSummary } from "@medialane/ui";

export function useRewards(address: string | null | undefined) {
  return useRewardsBase(address);
}

export function useLeaderboard(page = 1, limit = 50) {
  return useLeaderboardBase(page, limit);
}

export function useRewardsEvents(address: string | null | undefined, page = 1, limit = 20) {
  return useRewardsEventsBase(address, page, limit);
}

export function useRewardsConfig() {
  return useRewardsConfigBase();
}

export function useRewardsBatch(addresses: string[]) {
  return useRewardsBatchBase(addresses);
}
