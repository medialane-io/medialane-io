"use client";

import useSWR from "swr";
import { useSiwsToken } from "./use-siws-token";
import { useWalletNativeSession } from "./use-wallet-native-session";
import { getMedialaneClient } from "@/lib/medialane-client";

// Only reads an already-cached SIWS token — never triggers a sign-in prompt
// just from rendering a page that happens to check this.
export function useEmailVerificationRequired(): boolean {
  const { address } = useWalletNativeSession();
  const { getValidToken } = useSiwsToken();

  const { data } = useSWR(
    address ? ["email-verification-required", address] : null,
    async () => {
      const token = getValidToken();
      if (!token) return null;
      return getMedialaneClient().api.getMyWallet(token);
    },
    { revalidateOnFocus: false, shouldRetryOnError: false }
  );

  return data?.requiresEmailVerification ?? false;
}
