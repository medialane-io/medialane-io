"use client";

import { useCallback, useEffect, useState } from "react";
import { useWalletNativeSession } from "@/hooks/use-wallet-native-session";
import { useSiwsToken } from "@/hooks/use-siws-token";
import { getMedialaneClient } from "@/lib/medialane-client";
import { saveAccountEmail } from "@/lib/wallet/account-wallet";

export interface AccountEmail {
  email: string | null;
  verified: boolean;
  deadline: string | null;
}

export function useAccountEmail() {
  const { address } = useWalletNativeSession();
  const { getValidToken, signIn } = useSiwsToken();
  const [status, setStatus] = useState<AccountEmail | null>(null);

  useEffect(() => {
    if (!address) return;
    (async () => {
      const token = getValidToken() ?? (await signIn());
      if (!token) return;
      const result = await getMedialaneClient().api.getMyWallet(token);
      if (result) setStatus({ email: result.email ?? null, verified: !result.emailDeadline, deadline: result.emailDeadline ?? null });
    })();
  }, [address, getValidToken, signIn]);

  const markVerified = useCallback(() => setStatus((s) => (s ? { ...s, verified: true, deadline: null } : s)), []);

  const changeEmail = useCallback(
    async (email: string) => {
      const token = getValidToken() ?? (await signIn());
      if (!token) throw new Error("Not authenticated");
      const result = await getMedialaneClient().api.changeMyEmail(email, token);
      saveAccountEmail(email);
      setStatus((s) => ({ email: result.email, verified: !s?.deadline, deadline: s?.deadline ?? null }));
    },
    [getValidToken, signIn],
  );

  return { status, markVerified, changeEmail };
}
