"use client";

import { useState } from "react";
import { useWalletNativeSession } from "@/hooks/use-wallet-native-session";
import { useSession } from "@/hooks/use-session";
import { requireSignedIn } from "@/lib/account-gate";
import { useMyUsernameClaim, submitUsernameClaim, checkUsernameAvailability } from "@/hooks/use-username-claims";
import type { CheckState } from "@/components/settings/types";

export function useUsernameClaimForm() {
  const { address } = useWalletNativeSession();
  const { session } = useSession();
  const { username: approvedUsername, claim, mutate: mutateClaim } = useMyUsernameClaim();
  const [input, setInput] = useState("");
  const [claiming, setClaiming] = useState(false);
  const [claimStatus, setClaimStatus] = useState<"idle" | "success" | "error">("idle");
  const [claimError, setClaimError] = useState<string | null>(null);
  const [checkState, setCheckState] = useState<CheckState>("idle");
  const [checkReason, setCheckReason] = useState<string | undefined>();

  const change = (value: string) => {
    setInput(value);
    setCheckState("idle");
    setCheckReason(undefined);
    setClaimStatus("idle");
    setClaimError(null);
  };

  async function check() {
    if (!input.trim()) return;
    setCheckState("checking");
    setCheckReason(undefined);
    try {
      const result = await checkUsernameAvailability(input);
      setCheckState(result.available ? "available" : "taken");
      if (!result.available) setCheckReason(result.reason);
    } catch {
      setCheckState("idle");
      setClaimError("Could not check username availability");
    }
  }

  async function submit() {
    if (!input.trim()) return;
    setClaiming(true);
    try {
      requireSignedIn(session);
      const result = await submitUsernameClaim(input.trim().toLowerCase());
      if (result.error) {
        setClaimStatus("error");
        setClaimError(result.error);
      } else {
        setClaimStatus("success");
        setInput("");
        setCheckState("idle");
        setCheckReason(undefined);
        await mutateClaim();
      }
    } catch {
      setClaimStatus("error");
      setClaimError("Failed to submit claim");
    } finally {
      setClaiming(false);
    }
  }

  return { address, approvedUsername, claim, input, change, check, submit, claiming, claimStatus, claimError, checkState, checkReason };
}
