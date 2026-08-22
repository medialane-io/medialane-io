"use client";

import { toast } from "sonner";
import { Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { MarketplaceErrorState, MarketplaceSuccessState } from "@medialane/ui";
import { useWalletNativeSession } from "@/hooks/use-wallet-native-session";
import { useWalletWriteAction } from "@/hooks/use-wallet-write-action";
import { useMedialaneClient } from "@/hooks/use-medialane-client";
import { confirmIntentBestEffort } from "@/lib/wallet/intent-tx";
import { buildFeeCall } from "@medialane/sdk/starknet";
import { feeConfig } from "@/lib/fee";
import { EXPLORER_URL } from "@/lib/constants";
import type { Call } from "starknet";

interface SponsorshipAcceptButtonProps {
  offerId: string;
  sponsor: string;

  paymentToken: string;

  amount: string;
  onAccepted?: () => void;
}

export function SponsorshipAcceptButton({ offerId, sponsor, paymentToken, amount, onAccepted }: SponsorshipAcceptButtonProps) {
  const { hasWallet, address: walletAddress } = useWalletNativeSession();
  const client = useMedialaneClient();
  const action = useWalletWriteAction();
  const busy = action.status === "processing" || action.status === "confirming";

  const handleAccept = () => {
    if (!hasWallet || !walletAddress) {
      toast.error("Secure your account to accept this bid");
      return;
    }
    void action.run(async (signer) => {
      const intentRes = await client.api.acceptSponsorshipBidIntent({ author: walletAddress, offerId, sponsor });
      const intent = intentRes.data;
      if (intent.requiresSignature) throw new Error("Unexpected signature requirement on sponsorship accept");
      const calls: Call[] = [...(intent.calls as Call[])];

      const feeCall = buildFeeCall(
        { surface: "sponsorship", token: paymentToken, grossAmount: BigInt(amount) },
        feeConfig,
      );
      if (feeCall) {
        calls.push({
          contractAddress: feeCall.contractAddress,
          entrypoint: feeCall.entrypoint,
          calldata: feeCall.calldata as string[],
        });
      }

      const { txHash } = await signer.execute(calls);
      await confirmIntentBestEffort(client, intent.id, txHash);
      onAccepted?.();
      return { txHash };
    });
  };

  return (
    <>
      <Button size="sm" variant="outline" className="gap-1.5" onClick={handleAccept} disabled={busy}>
        {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
        Accept
      </Button>

      <Dialog open={action.status === "success" || action.status === "error"} onOpenChange={(open) => { if (!open) action.reset(); }}>
        <DialogContent className="max-w-[calc(100%-6px)] sm:max-w-md p-0 overflow-hidden gap-0 rounded-2xl">
          <DialogTitle className="sr-only">{action.status === "success" ? "Bid accepted" : "Accept failed"}</DialogTitle>
          <DialogDescription className="sr-only">Review the result of accepting this sponsorship bid.</DialogDescription>
          {action.status === "success" ? (
            <MarketplaceSuccessState name="License" title="Bid accepted!" description="The sponsor's license is now on-chain." txHash={action.txHash} explorerUrl={EXPLORER_URL} onDone={action.reset} />
          ) : action.status === "error" ? (
            <MarketplaceErrorState name="License" title="Accept failed" description="Accepting this bid could not be completed." error={action.error ?? undefined} txHash={action.txHash} explorerUrl={EXPLORER_URL} onDone={action.reset} />
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
