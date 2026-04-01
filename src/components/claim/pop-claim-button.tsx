"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2, CheckCircle2, Ban, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PinDialog } from "@/components/chipi/pin-dialog";
import { WalletSetupDialog } from "@/components/chipi/wallet-setup-dialog";
import { useChipiTransaction } from "@/hooks/use-chipi-transaction";
import { useSessionKey } from "@/hooks/use-session-key";
import { useUser } from "@clerk/nextjs";
import { usePopClaimStatus } from "@/hooks/use-pop";

interface PopClaimButtonProps {
  collectionAddress: string;
}

export function PopClaimButton({ collectionAddress }: PopClaimButtonProps) {
  const { isSignedIn } = useUser();
  const { walletAddress, hasWallet } = useSessionKey();
  const { claimStatus, isLoading, mutate } = usePopClaimStatus(
    collectionAddress,
    walletAddress ?? null
  );
  const { executeTransaction, isSubmitting } = useChipiTransaction();
  const [pinOpen, setPinOpen] = useState(false);
  const [walletSetupOpen, setWalletSetupOpen] = useState(false);

  const handleClaim = () => {
    if (!isSignedIn) {
      toast.error("Sign in to claim your credential");
      return;
    }
    if (!hasWallet) {
      setWalletSetupOpen(true);
      return;
    }
    setPinOpen(true);
  };

  const handlePinSubmit = async (pin: string) => {
    setPinOpen(false);
    try {
      const result = await executeTransaction({
        pin,
        contractAddress: collectionAddress,
        calls: [{ contractAddress: collectionAddress, entrypoint: "claim", calldata: [] }],
      });
      if (result.status === "confirmed") {
        toast.success("Credential claimed! Your proof of participation is on-chain.");
        mutate();
      } else {
        toast.error(result.revertReason ?? "Transaction reverted");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Claim failed");
    }
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
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <><Loader2 className="h-3.5 w-3.5 animate-spin" />Claiming…</>
        ) : (
          <><Award className="h-3.5 w-3.5" />Claim credential</>
        )}
      </Button>

      <PinDialog
        open={pinOpen}
        onSubmit={handlePinSubmit}
        onCancel={() => setPinOpen(false)}
        title="Claim your credential"
        description="Enter your PIN to mint your proof of participation on Starknet."
      />

      <WalletSetupDialog
        open={walletSetupOpen}
        onOpenChange={setWalletSetupOpen}
      />
    </>
  );
}
