"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Handshake } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { PinDialog } from "@/components/chipi/pin-dialog";
import { useWriteAction } from "@/hooks/use-write-action";
import { WalletSetupDialog } from "@/components/chipi/wallet-setup-dialog";
import { MarketplaceErrorState, MarketplaceSuccessState } from "@/components/marketplace/marketplace-dialog-primitives";
import { useUser } from "@clerk/nextjs";
import { EXPLORER_URL } from "@/lib/constants";
import { STARKNET_IP_SPONSORSHIP_CONTRACT } from "@/lib/constants";
import { getListableTokens } from "@medialane/sdk";

interface SponsorshipBidButtonProps {
  offerId: string;
  minAmount: string;
  paymentToken: string;
  onBidPlaced?: () => void;
}

function u256CallData(value: bigint): [string, string] {
  const low = (value & BigInt("0xffffffffffffffffffffffffffffffff")).toString();
  const high = (value >> 128n).toString();
  return [low, high];
}

export function SponsorshipBidButton({ offerId, minAmount, paymentToken, onBidPlaced }: SponsorshipBidButtonProps) {
  const { isSignedIn } = useUser();
  const action = useWriteAction();
  const busy = action.status === "processing" || action.status === "confirming";
  const [amount, setAmount] = useState("");

  const knownToken = getListableTokens().find((t) => t.address.toLowerCase() === paymentToken.toLowerCase());
  const decimals = knownToken?.decimals ?? 18;
  const minAmountDisplay = `${Number((BigInt(minAmount) * 10000n) / BigInt(10 ** decimals)) / 10000} ${knownToken?.symbol ?? "tokens"}`;

  const handleBid = () => {
    if (!isSignedIn) {
      toast.error("Sign in to place a bid");
      return;
    }
    if (!amount || Number(amount) <= 0) {
      toast.error("Enter a bid amount");
      return;
    }
    void action.run(async (secret) => {
      const amountBigInt = BigInt(Math.round(Number(amount) * 10 ** decimals));
      const [low, high] = u256CallData(amountBigInt);
      const result = await action.executeTransaction({
        pin: secret,
        calls: [
          { contractAddress: paymentToken, entrypoint: "approve", calldata: [STARKNET_IP_SPONSORSHIP_CONTRACT, low, high] },
          { contractAddress: STARKNET_IP_SPONSORSHIP_CONTRACT, entrypoint: "place_bid", calldata: [offerId, "0", low, high] },
        ],
      });
      if (result.status === "confirmed") onBidPlaced?.();
      return result;
    });
  };

  return (
    <>
      <div className="flex gap-2">
        <Input type="number" min={0} step="0.01" placeholder={`Min ${minAmountDisplay}`} value={amount} onChange={(e) => setAmount(e.target.value)} />
        <Button size="sm" className="bg-rose-600 hover:bg-rose-700 text-white gap-1.5" onClick={handleBid} disabled={busy}>
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Handshake className="h-3.5 w-3.5" />}
          Bid
        </Button>
      </div>

      <PinDialog {...action.pinDialogProps} title="Place a sponsorship bid" description="This will approve your payment token and place your bid. Enter your PIN to confirm." />
      <WalletSetupDialog open={action.walletSetupOpen} onOpenChange={action.setWalletSetupOpen} />

      <Dialog open={action.status === "success" || action.status === "error"} onOpenChange={(open) => { if (!open) action.reset(); }}>
        <DialogContent className="max-w-[calc(100%-6px)] sm:max-w-md p-0 overflow-hidden gap-0 rounded-2xl">
          <DialogTitle className="sr-only">{action.status === "success" ? "Bid placed" : "Bid failed"}</DialogTitle>
          <DialogDescription className="sr-only">Review the result of your sponsorship bid transaction.</DialogDescription>
          {action.status === "success" ? (
            <MarketplaceSuccessState name="Bid" title="Bid placed!" description="Your sponsorship bid is now on-chain." txHash={action.txHash} explorerUrl={EXPLORER_URL} onDone={action.reset} />
          ) : action.status === "error" ? (
            <MarketplaceErrorState name="Bid" title="Bid failed" description="Placing your bid could not be completed." error={action.error ?? undefined} txHash={action.txHash} explorerUrl={EXPLORER_URL} onDone={action.reset} />
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
