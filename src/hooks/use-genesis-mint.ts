"use client";

import { useCallback, useEffect, useState } from "react";
import { UserFacingError, runIntentCalls, useTransaction } from "@medialane/ui";
import { MINT_CONTRACT } from "@/lib/constants";
import { getMedialaneClient } from "@/lib/medialane-client";
import { useGenesisHolding } from "./use-genesis-holding";

export type MintStep = "checking" | "ready" | "minting" | "success" | "error";

export interface GenesisMintMessages {
  preparing: string;
  submitting: string;
  noAccount: string;
  notStarted: string;
}

export interface UseGenesisMintOptions {
  address: string | null;
  messages: GenesisMintMessages;
}

export interface UseGenesisMint {
  step: MintStep;
  error: string | null;
  statusMsg: string;
  txHash: string | null;
  tokenId: string | null;
  phase: ReturnType<typeof useTransaction>["phase"];
  start: () => void;
  retry: () => void;
  mintAnother: () => void;
}

export function useGenesisMint({ address, messages }: UseGenesisMintOptions): UseGenesisMint {
  const action = useTransaction();
  const { holding, checking, reload } = useGenesisHolding(address);

  const [local, setLocal] = useState<Exclude<MintStep, "checking">>("ready");
  const [error, setError] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState("");
  const [txHash, setTxHash] = useState<string | null>(null);
  const [mintingAgain, setMintingAgain] = useState(false);

  const start = useCallback(() => {
    setError(null);
    setLocal("minting");
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
      setLocal("success");
      setTxHash(action.txHash);
      reload();
    }
  }, [action.phase, action.txHash, reload]);

  useEffect(() => {
    if (action.phase === "error") {
      setLocal("error");
      setError(action.error);
    }
  }, [action.phase, action.error]);

  const retry = useCallback(() => {
    action.reset();
    setError(null);
    setLocal("ready");
  }, [action]);

  const mintAnother = useCallback(() => {
    setMintingAgain(true);
    setTxHash(null);
    setLocal("ready");
  }, []);

  let step: MintStep = local;
  if (local === "ready" && !mintingAgain) {
    if (checking) step = "checking";
    else if (holding?.owned) step = "success";
  }

  return {
    step,
    error,
    statusMsg,
    txHash,
    tokenId: holding?.tokenId ?? null,
    phase: action.phase,
    start,
    retry,
    mintAnother,
  };
}
