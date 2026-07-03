"use client";

import { toast } from "sonner";
import { Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { PinDialog } from "@/components/chipi/pin-dialog";
import { useWriteAction } from "@/hooks/use-write-action";
import { WalletSetupDialog } from "@/components/chipi/wallet-setup-dialog";
import { MarketplaceErrorState, MarketplaceSuccessState } from "@/components/marketplace/marketplace-dialog-primitives";
import { useUser } from "@clerk/nextjs";
import { EXPLORER_URL } from "@/lib/constants";
import { STARKNET_IP_SPONSORSHIP_CONTRACT, STARKNET_IP_SPONSORSHIP_LICENSE_CONTRACT } from "@/lib/constants";
import { Contract, type Abi } from "starknet";
import { starknetProvider } from "@/lib/starknet";
import { IPGenesisABI } from "@medialane/sdk";

interface SponsorshipAcceptButtonProps {
  offerId: string;
  sponsor: string;
  licenseTermsUri: string;
  onAccepted?: () => void;
}

/**
 * Author-only. Settles the sponsor's payment (allowance pull inside
 * accept_bid, no escrow) and mints a non-authoritative receipt NFT to the
 * sponsor via the dedicated sponsorship-license IPGenesis instance — never
 * the genesis-mint instance. is_license_valid() on IPSponsorship stays the
 * sole authority for gating; the receipt is a wallet-visible courtesy only.
 */
export function SponsorshipAcceptButton({ offerId, sponsor, licenseTermsUri, onAccepted }: SponsorshipAcceptButtonProps) {
  const { isSignedIn } = useUser();
  const action = useWriteAction();
  const busy = action.status === "processing" || action.status === "confirming";

  const handleAccept = () => {
    if (!isSignedIn) {
      toast.error("Sign in to accept this bid");
      return;
    }
    if (!STARKNET_IP_SPONSORSHIP_LICENSE_CONTRACT) {
      toast.error("Sponsorship license contract not configured");
      return;
    }
    void action.run(async (secret) => {
      const receipt = new Contract(IPGenesisABI as unknown as Abi, STARKNET_IP_SPONSORSHIP_LICENSE_CONTRACT, starknetProvider);
      const mintCall = receipt.populate("mint_item", [sponsor, licenseTermsUri]);

      const result = await action.executeTransaction({
        pin: secret,
        calls: [
          { contractAddress: STARKNET_IP_SPONSORSHIP_CONTRACT, entrypoint: "accept_bid", calldata: [offerId, "0", sponsor] },
          { contractAddress: STARKNET_IP_SPONSORSHIP_LICENSE_CONTRACT, entrypoint: "mint_item", calldata: mintCall.calldata as string[] },
        ],
      });
      if (result.status === "confirmed") onAccepted?.();
      return result;
    });
  };

  return (
    <>
      <Button size="sm" variant="outline" className="gap-1.5" onClick={handleAccept} disabled={busy}>
        {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
        Accept
      </Button>

      <PinDialog {...action.pinDialogProps} title="Accept sponsorship bid" description="This will settle the sponsor's payment and issue their license. Enter your PIN to confirm." />
      <WalletSetupDialog open={action.walletSetupOpen} onOpenChange={action.setWalletSetupOpen} />

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
