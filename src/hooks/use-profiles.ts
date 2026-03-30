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
    async () => {
      try {
        return await getMedialaneClient().api.getCreatorProfile(walletAddress!);
      } catch (e: unknown) {
        // 404 means no profile yet — return null instead of throwing so the
        // global SWR error toast is not triggered and the form stays editable.
        const msg = e instanceof Error ? e.message : "";
        const status = (e as { status?: number })?.status;
        if (msg.includes("404") || msg.includes("Not Found") || status === 404) {
          return null;
        }
        throw e;
      }
    },
    { revalidateOnFocus: false, revalidateOnMount: true }
  );
  return { profile: data ?? null, isLoading, error, mutate };
}
