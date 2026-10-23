"use client";

import { Loader2, Award } from "lucide-react";
import { Button } from "@medialane/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@medialane/ui/dialog";
import { useEffect, useState } from "react";
import { popClaimState, type PopClaimInfo } from "@medialane/sdk/starknet";
import { claimProofFor, MarketplaceErrorState, MarketplaceSuccessState, runIntentCalls, usePopClaimStatus } from "@medialane/ui";

import { useWalletWriteAction } from "@/hooks/use-wallet-write-action";
import { useWalletNativeSession } from "@/hooks/use-wallet-native-session";

import { RewardEarned } from "@/lib/reward-earned";
import { EXPLORER_URL } from "@/lib/constants";
import { getMedialaneClient } from "@/lib/medialane-client";

interface PopClaimButtonProps {
  collectionAddress: string;
}

export function PopClaimButton({ collectionAddress }: PopClaimButtonProps) {
  const { address: walletAddress } = useWalletNativeSession();
  const { hasClaimed, mutate } = usePopClaimStatus(collectionAddress, walletAddress ?? null);
  const [proof, setProof] = useState<string[] | null>(null);
  const [info, setInfo] = useState<PopClaimInfo | null>(null);
  const action = useWalletWriteAction();
  const busy = action.status === "processing" || action.status === "confirming";

  useEffect(() => {
    let storage: Storage | null = null;
    try {
      storage = window.sessionStorage;
    } catch {
      storage = null;
    }
    setProof(claimProofFor(storage, collectionAddress, window.location.hash));
    getMedialaneClient().api.chainReads.popClaimInfo(collectionAddress)
      .then(setInfo)
      .catch(() => setInfo(null));
  }, [collectionAddress]);

  const state = popClaimState({
    hasClaimed,
    proof,
    wallet: walletAddress ?? null,
    info: info && { ...info, now: Math.floor(Date.now() / 1000) },
  });

  const handleClaim = () => {
    if (!proof) return;
    void action.run((signer) =>
      runIntentCalls(signer, () => getMedialaneClient().api.intents.create("pop-claim", { claimer: signer.address, collection: collectionAddress, proof })),
    );
  };

  useEffect(() => {
    if (action.status === "success") mutate();
  }, [action.status, mutate]);

  return (
    <>
      {(state === "ready" || busy) && (
        <Button
          size="sm"
          className="w-full gap-1.5"
          onClick={handleClaim}
          disabled={busy}
        >
          {busy ? (
            <><Loader2 className="h-3.5 w-3.5 animate-spin" />Claiming…</>
          ) : (
            <><Award className="h-3.5 w-3.5" />Claim credential</>
          )}
        </Button>
      )}

      <Dialog open={action.status === "success" || action.status === "error"} onOpenChange={(open) => { if (!open) action.reset(); }}>
        <DialogContent className="max-w-[calc(100%-6px)] sm:max-w-md p-0 overflow-hidden gap-0 rounded-2xl">
          <DialogTitle className="sr-only">
            {action.status === "success" ? "Credential claimed" : "Credential claim failed"}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Review the result of your credential claim transaction.
          </DialogDescription>
          {action.status === "success" ? (
            <MarketplaceSuccessState
              name="Credential"
              title="Credential claimed!"
              description="Your proof of participation is now on-chain."
              txHash={action.txHash}
              explorerUrl={EXPLORER_URL}
              footer={<RewardEarned actionType="claim_pop" />}
              onDone={action.reset}
            />
          ) : action.status === "error" ? (
            <MarketplaceErrorState
              name="Credential"
              title="Claim failed"
              description="The credential claim could not be completed."
              error={action.error ?? undefined}
              txHash={action.txHash}
              explorerUrl={EXPLORER_URL}
              onDone={action.reset}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
