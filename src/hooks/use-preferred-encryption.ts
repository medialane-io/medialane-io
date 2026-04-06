"use client";

import useSWR from "swr";
import type { WalletEncryptionPreference } from "@/lib/creator-encryption-preference";
import { useMedialaneClient } from "@/hooks/use-medialane-client";
import { normalizeAddress } from "@/lib/utils";

type CreatorProfileLite = {
  preferredEncryption?: WalletEncryptionPreference | null;
} | null;

export function usePreferredEncryption(walletAddress: string | null) {
  const client = useMedialaneClient();
  const normalized = walletAddress ? normalizeAddress(walletAddress) : null;

  const { data, isLoading, error } = useSWR(
    normalized ? `preferred-encryption-${normalized}` : null,
    async () => {
      const profile = (await client.api.getCreatorProfile(normalized!)) as CreatorProfileLite;
      return profile?.preferredEncryption ?? null;
    },
    { revalidateOnFocus: false }
  );

  return {
    preferredEncryption: data ?? null,
    isLoadingPreferredEncryption: isLoading,
    preferredEncryptionError: error,
  };
}
