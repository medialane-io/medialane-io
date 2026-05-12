"use client";

import useSWR from "swr";
import { MEDIALANE_BACKEND_URL, MEDIALANE_API_KEY } from "@/lib/constants";

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

// ── Fetcher ───────────────────────────────────────────────────────────────────

async function backendFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${MEDIALANE_BACKEND_URL}${path}`, {
    headers: { "x-api-key": MEDIALANE_API_KEY },
  });
  if (!res.ok) throw new Error(`Rewards API error: ${res.status}`);
  const json = await res.json();
  return json.data as T;
}

// ── Hooks ─────────────────────────────────────────────────────────────────────

export function useRewards(address: string | null | undefined) {
  return useSWR<UserRewards>(
    address ? `/v1/rewards/${address}` : null,
    (key: string) => backendFetch<UserRewards>(key),
    { revalidateOnFocus: false, dedupingInterval: 60_000 }
  );
}

export function useLeaderboard(page = 1, limit = 50) {
  return useSWR<{ data: LeaderboardEntry[]; meta: { page: number; limit: number; total: number } }>(
    `/v1/rewards?page=${page}&limit=${limit}`,
    async (key: string) => {
      const res = await fetch(`${MEDIALANE_BACKEND_URL}${key}`, {
        headers: { "x-api-key": MEDIALANE_API_KEY },
      });
      if (!res.ok) throw new Error(`Leaderboard API error: ${res.status}`);
      return res.json();
    },
    { revalidateOnFocus: false, dedupingInterval: 120_000 }
  );
}
