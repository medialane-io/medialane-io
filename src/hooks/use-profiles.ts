import useSWR from "swr";
import { client } from "@/lib/medialane-client";

export function useCollectionProfile(contractAddress: string | undefined) {
  const { data, error, isLoading, mutate } = useSWR(
    contractAddress ? `profile-collection-${contractAddress}` : null,
    () => client.getCollectionProfile(contractAddress!),
    { revalidateOnFocus: false }
  );
  return { profile: data ?? null, isLoading, error, mutate };
}

export function useCreatorProfile(walletAddress: string | undefined) {
  const { data, error, isLoading, mutate } = useSWR(
    walletAddress ? `profile-creator-${walletAddress}` : null,
    () => client.getCreatorProfile(walletAddress!),
    { revalidateOnFocus: false }
  );
  return { profile: data ?? null, isLoading, error, mutate };
}
