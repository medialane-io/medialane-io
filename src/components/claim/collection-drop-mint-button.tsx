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
import { useDropMintStatus, type DropConditions } from "@/hooks/use-drops";
import { getListableTokens } from "@medialane/sdk";

interface CollectionDropMintButtonProps {
  collectionAddress: string;
  conditions?: DropConditions;
}

function getPriceBigInt(conditions?: DropConditions): bigint {
  if (!conditions || conditions.price === "0" || conditions.paymentToken === "0x0") return 0n;
  try {
    return BigInt(conditions.price);
  } catch {
    return 0n;
  }
}

function u256CallData(value: bigint): [string, string] {
  const low  = (value & BigInt("0xffffffffffffffffffffffffffffffff")).toString();
  const high = (value >> 128n).toString();
  return [low, high];
}

export function CollectionDropMintButton({
  collectionAddress,
  conditions,
}: CollectionDropMintButtonProps) {
  const { isSignedIn } = useUser();
  const { walletAddress, hasWallet } = useSessionKey();
  const { mintStatus, isLoading, mutate } = useDropMintStatus(
    collectionAddress,
    walletAddress ?? null
  );
  const { executeTransaction, isSubmitting } = useChipiTransaction();
  const [pinOpen, setPinOpen] = useState(false);
  const [walletSetupOpen, setWalletSetupOpen] = useState(false);

  const price = getPriceBigInt(conditions);
  const isPaid = price > 0n;

  const paymentToken = isPaid && conditions
    ? getListableTokens().find(
        (t) => t.address.toLowerCase() === conditions.paymentToken.toLowerCase()
      ) ?? null
    : null;

  const priceDisplay = isPaid && paymentToken
    ? `${Number(price * 10000n / BigInt(10 ** paymentToken.decimals)) / 10000} ${paymentToken.symbol}`
    : null;

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
      const calls: Array<{ contractAddress: string; entrypoint: string; calldata: string[] }> = [];

      if (isPaid && conditions && conditions.paymentToken !== "0x0") {
        // ERC-20 approve(collectionAddress, price as u256)
        const [priceLow, priceHigh] = u256CallData(price);
        calls.push({
          contractAddress: conditions.paymentToken,
          entrypoint: "approve",
          calldata: [collectionAddress, priceLow, priceHigh],
        });
      }

      // claim(quantity: u256(1))
      calls.push({
        contractAddress: collectionAddress,
        entrypoint: "claim",
        calldata: ["1", "0"],
      });

      const result = await executeTransaction({
        pin,
        contractAddress: collectionAddress,
        calls,
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
        size="lg"
        className="w-full gap-1.5 bg-orange-600 hover:bg-orange-700 text-white"
        onClick={handleMint}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Minting…
          </>
        ) : (
          <>
            <Package className="h-4 w-4" />
            {priceDisplay ? `Mint for ${priceDisplay}` : "Mint free"}
          </>
        )}
      </Button>

      <PinDialog
        open={pinOpen}
        onSubmit={handlePinSubmit}
        onCancel={() => setPinOpen(false)}
        title={isPaid ? `Mint for ${priceDisplay}` : "Mint your drop token"}
        description={
          isPaid
            ? "This will approve the payment and mint your token. Enter your PIN to confirm."
            : "Enter your PIN to mint from this drop on Starknet."
        }
      />

      <WalletSetupDialog
        open={walletSetupOpen}
        onOpenChange={setWalletSetupOpen}
      />
    </>
  );
}
