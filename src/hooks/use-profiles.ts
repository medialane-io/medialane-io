import useSWR from "swr";
import { getMedialaneClient } from "@/lib/medialane-client";

export function useCollectionProfile(contractAddress: string | undefined) {
  const { data, error, isLoading, mutate } = useSWR(
    contractAddress ? `profile-collection-${contractAddress}` : null,
    () => getMedialaneClient().api.getCollectionProfile(contractAddress!),
    { revalidateOnFocus: false }
  );
  return { profile: data ?? null, isLoading, error, mutate };
}

export function useCreatorProfile(walletAddress: string | undefined) {
  const { data, error, isLoading, mutate } = useSWR(
    walletAddress ? `profile-creator-${walletAddress}` : null,
    () => getMedialaneClient().api.getCreatorProfile(walletAddress!),
    { revalidateOnFocus: false, revalidateOnMount: true }
  );
  return { profile: data ?? null, isLoading, error, mutate };
}
