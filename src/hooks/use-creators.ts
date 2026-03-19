"use client";

import useSWR from "swr";
import { getMedialaneClient } from "@/lib/medialane-client";

export function useCreators(search?: string, page = 1, limit = 20) {
  const { data, error, isLoading } = useSWR(
    `creators-${search ?? ""}-${page}-${limit}`,
    () => getMedialaneClient().api.getCreators({ search, page, limit }),
    { revalidateOnFocus: false }
  );
  return {
    creators: data?.creators ?? [],
    total: data?.total ?? 0,
    isLoading,
    error,
  };
}
