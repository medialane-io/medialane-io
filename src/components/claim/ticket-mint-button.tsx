"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2, CheckCircle2, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { PinDialog } from "@/components/chipi/pin-dialog";
import { useWriteAction } from "@/hooks/use-write-action";
import { WalletSetupDialog } from "@/components/chipi/wallet-setup-dialog";
import { MarketplaceErrorState, MarketplaceSuccessState } from "@/components/marketplace/marketplace-dialog-primitives";
import { useSessionKey } from "@/hooks/use-session-key";
import { useUser } from "@clerk/nextjs";
import { useTicketStatus } from "@/hooks/use-tickets";
import { EXPLORER_URL } from "@/lib/constants";
import { getListableTokens } from "@medialane/sdk";

interface TicketMintButtonProps {
  collectionAddress: string;
  ticketCollectionId: string;
  price: string;
  paymentToken: string | null;
  active: boolean;
}

function u256CallData(value: bigint): [string, string] {
  const low = (value & BigInt("0xffffffffffffffffffffffffffffffff")).toString();
  const high = (value >> 128n).toString();
  return [low, high];
}

export function TicketMintButton({
  collectionAddress,
  ticketCollectionId,
  price,
  paymentToken,
  active,
}: TicketMintButtonProps) {
  const { isSignedIn } = useUser();
  const { walletAddress } = useSessionKey();
  const { status, isLoading, mutate } = useTicketStatus(
    collectionAddress,
    ticketCollectionId,
    walletAddress ?? null
  );
  const action = useWriteAction();
  const busy = action.status === "processing" || action.status === "confirming";

  const priceBigInt = BigInt(price || "0");
  const isPaid = priceBigInt > 0n && !!paymentToken;
  const knownToken = isPaid
    ? getListableTokens().find((t) => t.address.toLowerCase() === paymentToken!.toLowerCase())
    : null;
  const priceDisplay = isPaid && knownToken
    ? `${Number((priceBigInt * 10000n) / BigInt(10 ** knownToken.decimals)) / 10000} ${knownToken.symbol}`
    : null;

  const handleMint = () => {
    if (!isSignedIn) {
      toast.error("Sign in to mint a ticket");
      return;
    }
    void action.run(handleUnlocked);
  };

  const handleUnlocked = async (secret: string) => {
    const calls: Array<{ contractAddress: string; entrypoint: string; calldata: string[] }> = [];

    if (isPaid) {
      if (!knownToken) throw new Error("Unknown payment token — cannot proceed");
      const [low, high] = u256CallData(priceBigInt);
      calls.push({
        contractAddress: paymentToken!,
        entrypoint: "approve",
        calldata: [collectionAddress, low, high],
      });
    }

    calls.push({
      contractAddress: collectionAddress,
      entrypoint: "mint_ticket",
      calldata: [ticketCollectionId, "0"],
    });

    const result = await action.executeTransaction({ pin: secret, calls });
    if (result.status === "confirmed") mutate();
    return result;
  };

  if (!active) {
    return (
      <div className="text-sm text-muted-foreground">
        Minting is closed for this event.
      </div>
    );
  }

  if (isLoading) {
    return (
      <Button variant="outline" size="sm" disabled className="w-full">
        <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
        Checking your tickets…
      </Button>
    );
  }

  return (
    <>
      <Button size="lg" className="w-full gap-1.5 bg-teal-600 hover:bg-teal-700 text-white" onClick={handleMint} disabled={busy}>
        {busy ? (
          <><Loader2 className="h-4 w-4 animate-spin" />Minting…</>
        ) : (
          <><Ticket className="h-4 w-4" />{priceDisplay ? `Mint for ${priceDisplay}` : "Mint free ticket"}</>
        )}
      </Button>
      {status && status.activeBalance > 0 && (
        <p className="text-xs text-center text-muted-foreground">
          You hold {status.activeBalance} active ticket{status.activeBalance !== 1 ? "s" : ""} for this event.
        </p>
      )}

      <PinDialog
        {...action.pinDialogProps}
        title={priceDisplay ? `Mint for ${priceDisplay}` : "Mint your ticket"}
        description={
          isPaid
            ? "This will approve the payment and mint your ticket. Enter your PIN to confirm."
            : "Enter your PIN to mint your ticket onchain."
        }
      />

      <WalletSetupDialog open={action.walletSetupOpen} onOpenChange={action.setWalletSetupOpen} />

      <Dialog open={action.status === "success" || action.status === "error"} onOpenChange={(open) => { if (!open) action.reset(); }}>
        <DialogContent className="max-w-[calc(100%-6px)] sm:max-w-md p-0 overflow-hidden gap-0 rounded-2xl">
          <DialogTitle className="sr-only">
            {action.status === "success" ? "Ticket minted" : "Ticket mint failed"}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Review the result of your ticket mint transaction.
          </DialogDescription>
          {action.status === "success" ? (
            <MarketplaceSuccessState
              name="Ticket"
              title="Ticket minted!"
              description="Your ticket is now on-chain."
              txHash={action.txHash}
              explorerUrl={EXPLORER_URL}
              onDone={action.reset}
            />
          ) : action.status === "error" ? (
            <MarketplaceErrorState
              name="Ticket"
              title="Mint failed"
              description="The ticket mint could not be completed."
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
