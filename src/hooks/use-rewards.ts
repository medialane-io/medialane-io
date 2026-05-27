"use client";

import useSWR from "swr";
import { apiFetch } from "@/lib/api-fetch";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface BadgeSummary {
  key: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  category: string;
}

export interface LevelSummary {
  level: number;
  name: string;
  xpRequired: number;
}

export interface UserRewards {
  address: string;
  totalXp: number;
  currentLevel: number;
  currentLevelName: string;
  badgeColor: string;
  nextLevel: LevelSummary | null;
  progressPct: number;
  breakdown: Record<string, number>;
  badges: BadgeSummary[];
  computedAt: string | null;
}

export interface LeaderboardEntry {
  rank: number;
  address: string;
  totalXp: number;
  currentLevel: number;
  currentLevelName: string;
  badgeColor: string;
}

// ── Hooks ─────────────────────────────────────────────────────────────────────

export function useRewards(address: string | null | undefined) {
  return useSWR<UserRewards>(
    address ? `/v1/rewards/${address}` : null,
    async (key: string) => {
      const json = await apiFetch<{ data: UserRewards }>(key);
      return json.data;
    },
    { revalidateOnFocus: false, dedupingInterval: 60_000 }
  );
}

export function useLeaderboard(page = 1, limit = 50) {
  return useSWR<{ data: LeaderboardEntry[]; meta: { page: number; limit: number; total: number } }>(
    `/v1/rewards?page=${page}&limit=${limit}`,
    (key: string) =>
      apiFetch<{ data: LeaderboardEntry[]; meta: { page: number; limit: number; total: number } }>(key),
    { revalidateOnFocus: false, dedupingInterval: 120_000 }
  );
}
