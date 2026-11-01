"use client";

import { useCallback, useEffect, useState } from "react";
import { UserFacingError, runIntentCalls, useTransaction } from "@medialane/ui";
import { MINT_CONTRACT } from "@/lib/constants";
import { getMedialaneClient } from "@/lib/medialane-client";

export type MintStep = "ready" | "minting" | "success" | "error";

export interface GenesisMintMessages {
  preparing: string;
  submitting: string;
  noAccount: string;
  notStarted: string;
}

export interface UseGenesisMintOptions {
  address: string | null;
  storageKey: string | null;
  messages: GenesisMintMessages;
}

export interface UseGenesisMint {
  step: MintStep;
  error: string | null;
  statusMsg: string;
  txHash: string | null;
  phase: ReturnType<typeof useTransaction>["phase"];
  start: () => void;
  retry: () => void;
  resetStored: () => void;
}

export function useGenesisMint({ address, storageKey, messages }: UseGenesisMintOptions): UseGenesisMint {
  const action = useTransaction();

  const [step, setStep] = useState<MintStep>("ready");
  const [error, setError] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState("");
  const [txHash, setTxHash] = useState<string | null>(null);

  useEffect(() => {
    if (!storageKey) return;
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      setTxHash(stored);
      setStep("success");
    }
  }, [storageKey]);

  const start = useCallback(() => {
    setError(null);
    setStep("minting");
    setStatusMsg(messages.preparing);

    void action.run(async (signer) => {
      if (!address) throw new UserFacingError(messages.noAccount);
      if (!MINT_CONTRACT) throw new UserFacingError(messages.notStarted);

      setStatusMsg(messages.submitting);
      await runIntentCalls(signer, () =>
        getMedialaneClient().api.intents.create("genesis-mint", { owner: signer.address, recipient: address }),
      );
    });
  }, [address, action, messages]);

  useEffect(() => {
    if (action.phase === "success" && action.txHash) {
      setStep("success");
      setTxHash(action.txHash);
      if (storageKey) localStorage.setItem(storageKey, action.txHash);
    }
  }, [action.phase, action.txHash, storageKey]);

  useEffect(() => {
    if (action.phase === "error") {
      setStep("error");
      setError(action.error);
    }
  }, [action.phase, action.error]);

  const retry = useCallback(() => {
    action.reset();
    setError(null);
    setStep("ready");
  }, [action]);

  const resetStored = useCallback(() => {
    if (storageKey) localStorage.removeItem(storageKey);
    setTxHash(null);
    setStep("ready");
  }, [storageKey]);

  return { step, error, statusMsg, txHash, phase: action.phase, start, retry, resetStored };
}
