"use client";

import { useCallback } from "react";
import { useSession, refreshSession } from "@/hooks/use-session";
import { getMedialaneClient } from "@/lib/medialane-client";

export interface AccountEmail {
  email: string | null;
  verified: boolean;
  deadline: string | null;
}

export function useAccountEmail() {
  const { session } = useSession();
  const status: AccountEmail | null = session
    ? { email: session.email, verified: !session.emailDeadline, deadline: session.emailDeadline }
    : null;

  const markVerified = useCallback(() => void refreshSession(), []);

  const changeEmail = useCallback(async (email: string) => {
    await getMedialaneClient().api.changeMyEmail(email);
    await refreshSession();
  }, []);

  return { status, markVerified, changeEmail };
}
