import useSWR from "swr";
import { MEDIALANE_BACKEND_URL, MEDIALANE_API_KEY } from "@/lib/constants";

interface PlatformStats {
  collections: number;
  tokens: number;
  sales: number;
}

async function fetchStats(): Promise<PlatformStats> {
  const res = await fetch(`${MEDIALANE_BACKEND_URL}/v1/stats`, {
    headers: { "x-api-key": MEDIALANE_API_KEY },
  });
  if (!res.ok) throw new Error("Failed to fetch stats");
  const json = await res.json();
  return json.data as PlatformStats;
}

export function usePlatformStats() {
  const { data, isLoading } = useSWR<PlatformStats>(
    "platform-stats",
    fetchStats,
    { revalidateOnFocus: false, dedupingInterval: 60_000 }
  );

  return { stats: data ?? null, isLoading };
}
