"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2, CheckCircle2, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { PinDialog } from "@/components/chipi/pin-dialog";
import { useWriteAction } from "@/hooks/use-write-action";
import { WalletSetupDialog } from "@/components/chipi/wallet-setup-dialog";
import { MarketplaceErrorState, MarketplaceSuccessState } from "@/components/marketplace/marketplace-dialog-primitives";
import { useSessionKey } from "@/hooks/use-session-key";
import { EXPLORER_URL } from "@/lib/constants";
import { useUser } from "@clerk/nextjs";
import { useDropMintStatus, type DropConditions } from "@/hooks/use-drops";
import { getListableTokens } from "@medialane/sdk";
import { useFeeCharge } from "@/hooks/use-fee-charge";

interface CollectionDropMintButtonProps {
  collectionAddress: string;
  conditions?: DropConditions;
}

// 10,000 tokens at 18 decimals — any drop priced above this is almost certainly
// a tampered API response. Prevents unlimited ERC-20 approval from a bad backend.
const MAX_APPROVAL_AMOUNT = 10_000n * 10n ** 18n;

function getPriceBigInt(conditions?: DropConditions): bigint {
  if (!conditions || conditions.price === "0" || conditions.paymentToken === "0x0") return 0n;
  try {
    const price = BigInt(conditions.price);
    if (price > MAX_APPROVAL_AMOUNT) {
      console.error("[drop-mint] price exceeds sanity cap — possible API tampering", conditions.price);
      return 0n;
    }
    return price;
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
  const action = useWriteAction();
  const busy = action.status === "processing" || action.status === "confirming";
  const { chargeFee } = useFeeCharge();

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
    // action.run gates wallet + unlock; we just build calls and execute.
    void action.run(handleUnlocked);
  };

  // `secret` is the wallet-unlock material — a typed PIN or the passkey key.
  const handleUnlocked = async (secret: string) => {
    const calls: Array<{ contractAddress: string; entrypoint: string; calldata: string[] }> = [];

    if (isPaid && conditions && conditions.paymentToken !== "0x0") {
      // Verify the payment token is a known listable token before approving
      const knownToken = getListableTokens().find(
        (t) => t.address.toLowerCase() === conditions.paymentToken.toLowerCase()
      );
      if (!knownToken) throw new Error("Unknown payment token — cannot proceed");
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

    const result = await action.executeTransaction({ pin: secret, calls });
    if (result.status === "reverted") return result;

    mutate();
    // Fee — un-awaited fire-and-forget; paid mints only. Drop claim quantity is
    // fixed at 1, so grossAmount = price.
    if (isPaid && conditions && conditions.paymentToken !== "0x0") {
      chargeFee({
        surface: "launchpad",
        token: conditions.paymentToken,
        grossAmount: price,
        pin: secret,
      });
    }
    return result;
  };

  if (isLoading) {
    return (
      <Button variant="outline" size="sm" disabled className="w-full">
        <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
        Loading…
      </Button>
    );
  }

  // Per-wallet allowance: maxPerWallet "0" = unlimited.
  const maxPerWallet = conditions ? parseInt(conditions.maxPerWallet, 10) : 0;
  const mintedByWallet = mintStatus?.mintedByWallet ?? 0;
  const remaining = maxPerWallet > 0 ? Math.max(0, maxPerWallet - mintedByWallet) : Infinity;

  if (maxPerWallet > 0 && remaining <= 0) {
    return (
      <div className="flex items-center gap-1.5 text-sm text-orange-500 font-medium">
        <CheckCircle2 className="h-4 w-4 shrink-0" />
        Minted · {mintedByWallet} token{mintedByWallet !== 1 ? "s" : ""} (max reached)
      </div>
    );
  }

  return (
    <>
      <Button
        size="lg"
        className="w-full gap-1.5 bg-orange-600 hover:bg-orange-700 text-white"
        onClick={handleMint}
        disabled={busy}
      >
        {busy ? (
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
      {Number.isFinite(remaining) && (
        <p className="text-xs text-center text-muted-foreground">
          {mintedByWallet > 0 ? `You've minted ${mintedByWallet} · ` : ""}You can mint {remaining} more
        </p>
      )}

      <PinDialog
        {...action.pinDialogProps}
        title={isPaid ? `Mint for ${priceDisplay}` : "Mint your drop token"}
        description={
          isPaid
            ? "This will approve the payment and mint your token. Enter your PIN to confirm."
            : "Enter your PIN to mint from this drop onchain."
        }
      />

      <WalletSetupDialog
        open={action.walletSetupOpen}
        onOpenChange={action.setWalletSetupOpen}
      />

      <Dialog open={action.status === "success" || action.status === "error"} onOpenChange={(open) => { if (!open) action.reset(); }}>
        <DialogContent className="max-w-[calc(100%-6px)] sm:max-w-md p-0 overflow-hidden gap-0 rounded-2xl">
          <DialogTitle className="sr-only">
            {action.status === "success" ? "Drop mint complete" : "Drop mint failed"}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Review the result of your drop mint transaction.
          </DialogDescription>
          {action.status === "success" ? (
            <MarketplaceSuccessState
              name="Drop token"
              title="Mint complete!"
              description="Your drop token is now on-chain."
              txHash={action.txHash}
              explorerUrl={EXPLORER_URL}
              onDone={action.reset}
            />
          ) : action.status === "error" ? (
            <MarketplaceErrorState
              name="Drop token"
              title="Mint failed"
              description="The drop mint could not be completed."
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
