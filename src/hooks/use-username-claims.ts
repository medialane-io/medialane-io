"use client";

import useSWR from "swr";
import { useWalletNativeSession } from "@/hooks/use-wallet-native-session";
import { useSession } from "@medialane/ui/utils/use-session";
import { requireSignedIn } from "@/lib/account-gate";
import type { ApiUsernameClaim } from "@medialane/sdk";
import { getMedialaneClient } from "@/lib/medialane-client";


export function useMyUsernameClaim() {
  const { hasWallet } = useWalletNativeSession();
  const { session } = useSession();

  const { data, error, isLoading, mutate } = useSWR(
    hasWallet ? "username-claim-me" : null,
    async () => {
      requireSignedIn(session);
      return getMedialaneClient().api.creators.myUsernameClaim();
    },
    { revalidateOnFocus: false, shouldRetryOnError: false }
  );

  return { username: data?.username ?? null, claim: data?.claim ?? null, isLoading, error, mutate };
}

export function checkUsernameAvailability(username: string): Promise<{ available: boolean; reason?: string }> {
  return getMedialaneClient().api.creators.usernameAvailability(username);
}

export async function submitUsernameClaim(
  username: string,
  notifyEmail?: string
): Promise<{ claim?: ApiUsernameClaim; error?: string }> {
  try {
    return { claim: await getMedialaneClient().api.withBearer(notifyEmail).creators.submitUsernameClaim(username) };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to submit claim" };
  }
}

