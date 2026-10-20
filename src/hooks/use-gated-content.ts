"use client";

import useSWR from "swr";
import type { GatedContent, GatedContentState } from "@medialane/ui";
import { getMedialaneClient } from "@/lib/medialane-client";
import { useWalletNativeSession } from "@/hooks/use-wallet-native-session";
import { useSession } from "@/hooks/use-session";
import { requireSignedIn } from "@/lib/account-gate";


export function useGatedContent(contract: string | undefined): GatedContentState {
  const { hasWallet } = useWalletNativeSession();
  const { session } = useSession();

  const { data, error, isLoading } = useSWR<GatedContent | "not_holder">(
    contract && hasWallet ? ["gated-content", contract] : null,
    async () => {
      requireSignedIn(session);
      return (await getMedialaneClient().api.getGatedContent(contract!)) ?? "not_holder";
    },
    { shouldRetryOnError: false, revalidateOnFocus: false }
  );

  if (!hasWallet) return { status: "signed_out" };
  if (isLoading) return { status: "loading" };
  if (error) return { status: "error" };
  if (data === "not_holder" || data === undefined) return { status: "not_holder" };
  return { status: "unlocked", content: data };
}
