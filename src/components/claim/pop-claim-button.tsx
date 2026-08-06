"use client";

import { toast } from "sonner";
import { Loader2, CheckCircle2, Ban, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { useWalletWriteAction } from "@/hooks/use-wallet-write-action";
import { useWalletNativeSession } from "@/hooks/use-wallet-native-session";
import { MarketplaceErrorState, MarketplaceSuccessState } from "@/components/marketplace/marketplace-dialog-primitives";
import { usePopClaimStatus } from "@/hooks/use-pop";
import { rewardToast } from "@/lib/reward-toast";
import { EXPLORER_URL } from "@/lib/constants";

interface PopClaimButtonProps {
  collectionAddress: string;
}

export function PopClaimButton({ collectionAddress }: PopClaimButtonProps) {
  const { address: walletAddress, hasWallet } = useWalletNativeSession();
  const { claimStatus, isLoading, mutate } = usePopClaimStatus(
    collectionAddress,
    walletAddress ?? null
  );
  const action = useWalletWriteAction();
  const busy = action.status === "processing" || action.status === "confirming";

  const handleClaim = () => {
    if (!hasWallet) {
      toast.error("Set up your wallet to claim your credential");
      return;
    }
    void action.run(async (signer) => {
      const result = await signer.execute([
        { contractAddress: collectionAddress, entrypoint: "claim", calldata: [] },
      ]);
      mutate();
      rewardToast("claim_pop");
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
