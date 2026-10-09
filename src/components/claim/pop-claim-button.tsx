"use client";

import { Loader2, CheckCircle2, Ban, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { useEffect, useState } from "react";
import { decodePopClaimFragment } from "@medialane/sdk/starknet";
import { starknetProvider } from "@/lib/starknet";
import { popClaimState } from "@/lib/pop-claim";
import { useWalletWriteAction } from "@/hooks/use-wallet-write-action";
import { useWalletNativeSession } from "@/hooks/use-wallet-native-session";
import { MarketplaceErrorState, MarketplaceSuccessState } from "@medialane/ui";
import { usePopClaimStatus } from "@/hooks/use-pop";
import { RewardEarned } from "@/lib/reward-earned";
import { EXPLORER_URL } from "@/lib/constants";

interface PopClaimButtonProps {
  collectionAddress: string;
}

export function PopClaimButton({ collectionAddress }: PopClaimButtonProps) {
  const { address: walletAddress, hasWallet } = useWalletNativeSession();
  const { hasClaimed, mutate } = usePopClaimStatus(collectionAddress, walletAddress ?? null);
  const [proof, setProof] = useState<string[] | null>(null);
  const [root, setRoot] = useState<string | null>(null);
  const action = useWalletWriteAction();
  const busy = action.status === "processing" || action.status === "confirming";

  useEffect(() => {
    setProof(decodePopClaimFragment(window.location.hash));
    starknetProvider
      .callContract({ contractAddress: collectionAddress, entrypoint: "allowlist_root", calldata: [] })
      .then(([value]) => setRoot(value ?? null))
      .catch(() => setRoot(null));
  }, [collectionAddress]);

  const state = popClaimState({ hasClaimed, proof, root, wallet: walletAddress ?? null });

  const handleClaim = () => {
    if (!proof) return;
    void action.run((signer) =>
      signer.execute([
        { contractAddress: collectionAddress, entrypoint: "claim", calldata: [String(proof.length), ...proof] },
      ]),
    );
  };

  useEffect(() => {
    if (action.status === "success") mutate();
  }, [action.status, mutate]);

  if (hasWallet && state === "loading") {
    return (
      <Button variant="outline" size="sm" disabled className="w-full">
        <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
        Checking…
      </Button>
    );
  }

  if (state === "claimed") {
    return (
      <div className="flex items-center gap-1.5 text-sm text-green-500 font-medium">
        <CheckCircle2 className="h-4 w-4 shrink-0" />
        Claimed
      </div>
    );
  }

  if (hasWallet && state === "closed") {
    return (
      <p className="text-sm text-muted-foreground">Claims for this credential are closed.</p>
    );
  }

  if (hasWallet && state === "no-link") {
    return (
      <p className="text-sm text-muted-foreground">
        Open the claim link you received to claim this credential.
      </p>
    );
  }

  if (hasWallet && state === "wrong-wallet") {
    return (
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Ban className="h-3.5 w-3.5 shrink-0" />
        This claim link doesn&apos;t match this wallet, or the organizer has since published a new list.
      </div>
    );
  }

  return (
    <>
      <Button
        size="sm"
        className="w-full gap-1.5"
        onClick={handleClaim}
        disabled={busy || !hasWallet || state !== "ready"}
      >
        {busy ? (
          <><Loader2 className="h-3.5 w-3.5 animate-spin" />Claiming…</>
        ) : (
          <><Award className="h-3.5 w-3.5" />Claim credential</>
        )}
      </Button>
      {!hasWallet && (
        <p className="mt-1.5 text-xs text-muted-foreground">Secure your account first to claim your credential.</p>
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
