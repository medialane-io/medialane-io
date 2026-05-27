import useSWR from "swr";
import { apiFetch } from "@/lib/api-fetch";

interface PlatformStats {
  collections: number;
  tokens: number;
  sales: number;
}

export function usePlatformStats() {
  const { data, isLoading } = useSWR<PlatformStats>(
    "platform-stats",
    async () => {
      const json = await apiFetch<{ data: PlatformStats }>("/v1/stats");
      return json.data;
    },
    { revalidateOnFocus: false, dedupingInterval: 60_000 }
  );

  return { stats: data ?? null, isLoading };
}
