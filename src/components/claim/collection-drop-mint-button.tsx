"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2, CheckCircle2, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PinDialog } from "@/components/chipi/pin-dialog";
import { WalletSetupDialog } from "@/components/chipi/wallet-setup-dialog";
import { useChipiTransaction } from "@/hooks/use-chipi-transaction";
import { useSessionKey } from "@/hooks/use-session-key";
import { useUser } from "@clerk/nextjs";
import { useDropMintStatus } from "@/hooks/use-drops";

interface CollectionDropMintButtonProps {
  collectionAddress: string;
}

export function CollectionDropMintButton({ collectionAddress }: CollectionDropMintButtonProps) {
  const { isSignedIn } = useUser();
  const { walletAddress, hasWallet } = useSessionKey();
  const { mintStatus, isLoading, mutate } = useDropMintStatus(
    collectionAddress,
    walletAddress ?? null
  );
  const { executeTransaction, isSubmitting } = useChipiTransaction();
  const [pinOpen, setPinOpen] = useState(false);
  const [walletSetupOpen, setWalletSetupOpen] = useState(false);

  const handleMint = () => {
    if (!isSignedIn) {
      toast.error("Sign in to mint");
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
      // claim(quantity: u256) — u256(1) serializes as [low=1, high=0]
      const result = await executeTransaction({
        pin,
        contractAddress: collectionAddress,
        calls: [{ contractAddress: collectionAddress, entrypoint: "claim", calldata: ["1", "0"] }],
      });
      if (result.status === "confirmed") {
        toast.success("Minted! Your drop token is on-chain.");
        mutate();
      } else {
        toast.error(result.revertReason ?? "Transaction reverted");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Mint failed");
    }
  };

  if (isLoading) {
    return (
      <Button variant="outline" size="sm" disabled className="w-full">
        <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
        Loading…
      </Button>
    );
  }

  if (mintStatus && mintStatus.mintedByWallet > 0) {
    return (
      <div className="flex items-center gap-1.5 text-sm text-orange-500 font-medium">
        <CheckCircle2 className="h-4 w-4 shrink-0" />
        Minted · {mintStatus.mintedByWallet} token{mintStatus.mintedByWallet !== 1 ? "s" : ""}
      </div>
    );
  }

  return (
    <>
      <Button
        size="sm"
        className="w-full gap-1.5 bg-orange-600 hover:bg-orange-700 text-white"
        onClick={handleMint}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <><Loader2 className="h-3.5 w-3.5 animate-spin" />Minting…</>
        ) : (
          <><Package className="h-3.5 w-3.5" />Mint</>
        )}
      </Button>

      <PinDialog
        open={pinOpen}
        onSubmit={handlePinSubmit}
        onCancel={() => setPinOpen(false)}
        title="Mint your drop token"
        description="Enter your PIN to mint from this drop on Starknet."
      />

      <WalletSetupDialog
        open={walletSetupOpen}
        onOpenChange={setWalletSetupOpen}
      />
    </>
  );
}
