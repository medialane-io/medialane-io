"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2, CheckCircle2, Ban, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { PinDialog } from "@/components/chipi/pin-dialog";
import { useWriteAction } from "@/hooks/use-write-action";
import { WalletSetupDialog } from "@/components/chipi/wallet-setup-dialog";
import { MarketplaceErrorState, MarketplaceSuccessState } from "@/components/marketplace/marketplace-dialog-primitives";
import { useSessionKey } from "@/hooks/use-session-key";
import { useUser } from "@clerk/nextjs";
import { usePopClaimStatus } from "@/hooks/use-pop";
import { EXPLORER_URL } from "@/lib/constants";

interface PopClaimButtonProps {
  collectionAddress: string;
}

export function PopClaimButton({ collectionAddress }: PopClaimButtonProps) {
  const { isSignedIn } = useUser();
  const { walletAddress } = useSessionKey();
  const { claimStatus, isLoading, mutate } = usePopClaimStatus(
    collectionAddress,
    walletAddress ?? null
  );
  const action = useWriteAction();
  const busy = action.status === "processing" || action.status === "confirming";

  const handleClaim = () => {
    if (!isSignedIn) {
      toast.error("Sign in to claim your credential");
      return;
    }
    // action.run gates wallet (opens setup) + unlock (passkey/PIN); we just
    // execute and refresh claim status on confirm.
    void action.run(async (secret) => {
      const result = await action.executeTransaction({
        pin: secret,
        calls: [{ contractAddress: collectionAddress, entrypoint: "claim", calldata: [] }],
      });
      if (result.status === "confirmed") mutate();
      return result;
    });
  };

  if (isLoading) {
    return (
      <Button variant="outline" size="sm" disabled className="w-full">
        <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
        Checking eligibility…
      </Button>
    );
  }

  if (claimStatus?.hasClaimed) {
    return (
      <div className="flex items-center gap-1.5 text-sm text-green-500 font-medium">
        <CheckCircle2 className="h-4 w-4 shrink-0" />
        Claimed{claimStatus.tokenId ? ` · #${claimStatus.tokenId}` : ""}
      </div>
    );
  }

  if (claimStatus && !claimStatus.isEligible) {
    return (
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Ban className="h-3.5 w-3.5 shrink-0" />
        Not eligible
      </div>
    );
  }

  return (
    <>
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

      <PinDialog
        {...action.pinDialogProps}
        title="Claim your credential"
        description="Enter your PIN to mint your proof of participation onchain."
      />

      <WalletSetupDialog
        open={action.walletSetupOpen}
        onOpenChange={action.setWalletSetupOpen}
      />

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
