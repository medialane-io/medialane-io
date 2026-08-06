"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Handshake } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { MarketplaceErrorState, MarketplaceSuccessState } from "@/components/marketplace/marketplace-dialog-primitives";
import { rewardToast } from "@/lib/reward-toast";
import { useWalletNativeSession } from "@/hooks/use-wallet-native-session";
import { useWalletWriteAction } from "@/hooks/use-wallet-write-action";
import { useMedialaneClient } from "@/hooks/use-medialane-client";
import { executeIntent } from "@/lib/wallet/intent-tx";
import { EXPLORER_URL } from "@/lib/constants";
import { getListableTokens, normalizeAddress } from "@medialane/sdk";

interface SponsorshipBidButtonProps {
  offerId: string;
  minAmount: string;
  paymentToken: string;
  onBidPlaced?: () => void;
}

export function SponsorshipBidButton({ offerId, minAmount, paymentToken, onBidPlaced }: SponsorshipBidButtonProps) {
  const { hasWallet, address: walletAddress } = useWalletNativeSession();
  const client = useMedialaneClient();
  const action = useWalletWriteAction();
  const busy = action.status === "processing" || action.status === "confirming";
  const [amount, setAmount] = useState("");

  const knownToken = getListableTokens().find((t) => normalizeAddress("STARKNET", t.address) === normalizeAddress("STARKNET", paymentToken));
  const decimals = knownToken?.decimals ?? 18;
  const minAmountDisplay = `${Number((BigInt(minAmount) * 10000n) / BigInt(10 ** decimals)) / 10000} ${knownToken?.symbol ?? "tokens"}`;

  const handleBid = () => {
    if (!hasWallet || !walletAddress) {
      toast.error("Secure your account to place a bid");
      return;
    }
    if (!amount || Number(amount) <= 0) {
      toast.error("Enter a bid amount");
      return;
    }
    void action.run(async (signer) => {
      const amountBigInt = BigInt(Math.round(Number(amount) * 10 ** decimals));
      const intentRes = await client.api.placeSponsorshipBidIntent({
        sponsor: walletAddress,
        offerId,
        amount: amountBigInt.toString(),
        paymentToken,
      });
      const result = await executeIntent(signer, client, intentRes.data);
      onBidPlaced?.();
      rewardToast("place_sponsorship_bid");
      return result;
    });
  };

  return (
    <>
      <div className="flex gap-2">
        <Input type="number" min={0} step="0.01" placeholder={`Min ${minAmountDisplay}`} value={amount} onChange={(e) => setAmount(e.target.value)} />
        <Button size="sm" className="bg-brand-rose hover:brightness-110 text-white gap-1.5" onClick={handleBid} disabled={busy}>
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Handshake className="h-3.5 w-3.5" />}
          Bid
        </Button>
      </div>

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
