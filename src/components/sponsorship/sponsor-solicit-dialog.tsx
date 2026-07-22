"use client";

import { useState } from "react";
import { Contract, CairoOption, CairoOptionVariant, type Abi } from "starknet";
import { starknetProvider } from "@/lib/starknet";
import { Handshake, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { PinDialog } from "@/components/chipi/pin-dialog";
import { useWriteAction } from "@/hooks/use-write-action";
import { WalletSetupGate } from "@/components/transaction/wallet-setup-gate";
import { STARKNET_IP_SPONSORSHIP_CONTRACT } from "@/lib/constants";
import { LicenseTermsBuilder, EMPTY_SPONSORSHIP_TERMS, toLicenseMetadata, type SponsorshipTerms } from "@medialane/ui";
import { getTokenBySymbol, SUPPORTED_TOKENS } from "@medialane/sdk";
import { IPSponsorshipABI } from "@medialane/sdk/starknet";
import { pinLaunchpadMetadata } from "@/lib/launchpad-metadata";
import { rewardToast } from "@/lib/reward-toast";
import { toast } from "sonner";

const LISTABLE_TOKENS = SUPPORTED_TOKENS.filter((t) => t.listable);
const TOKEN_SYMBOLS = LISTABLE_TOKENS.map((t) => t.symbol);

interface SponsorSolicitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nftContract: string;
  tokenId: string;
  tokenName?: string;
  onSuccess?: () => void;
}

export function SponsorSolicitDialog({
  open, onOpenChange, nftContract, tokenId, tokenName, onSuccess,
}: SponsorSolicitDialogProps) {
  const action = useWriteAction();
  const busy = action.status === "processing" || action.status === "confirming";
  const [terms, setTerms] = useState<SponsorshipTerms>({ ...EMPTY_SPONSORSHIP_TERMS, paymentTokenSymbol: "USDC" });

  const onSubmit = () => {
    if (!terms.amount || Number(terms.amount) <= 0) { toast.error("Set a minimum bid before continuing"); return; }
    const token = getTokenBySymbol(terms.paymentTokenSymbol);
    if (!token) { toast.error("Pick a currency"); return; }
    const durationDays = Number(terms.durationDays);
    if (!durationDays || durationDays <= 0) { toast.error("How many days should the license last?"); return; }

    void action.run(async (secret) => {
      const licenseTermsUri = await pinLaunchpadMetadata(toLicenseMetadata(terms));

      const amount = BigInt(Math.round(Number(terms.amount) * 10 ** token.decimals));
      const duration = durationDays * 86400;
      const royaltyBps = BigInt(Math.round(Number(terms.royaltyPercent || "0") * 100));

      const contract = new Contract(IPSponsorshipABI as unknown as Abi, STARKNET_IP_SPONSORSHIP_CONTRACT, starknetProvider);
      const call = contract.populate("create_offer", [
        nftContract, BigInt(tokenId), amount, duration, token.address,
        licenseTermsUri, terms.transferable, royaltyBps, new CairoOption(CairoOptionVariant.None),
      ]);

      const result = await action.executeTransaction({
        pin: secret,
        calls: [{ contractAddress: STARKNET_IP_SPONSORSHIP_CONTRACT, entrypoint: "create_offer", calldata: call.calldata as string[] }],
      });
      if (result.status === "confirmed") {
        rewardToast("create_sponsorship_offer");
        onSuccess?.();
      }
      return result;
    });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg">
          {action.status === "success" ? (
            <div className="text-center space-y-4 py-4">
              <div className="flex justify-center">
                <div className="h-16 w-16 rounded-full bg-brand-rose/10 flex items-center justify-center">
                  <CheckCircle2 className="h-8 w-8 text-brand-rose" />
                </div>
              </div>
              <div className="space-y-1">
                <DialogTitle>Offer created</DialogTitle>
                <DialogDescription>{tokenName ?? "This asset"} is open for sponsorship bids.</DialogDescription>
              </div>
              <Button onClick={() => onOpenChange(false)} className="w-full">Close</Button>
            </div>
          ) : (
            <>
              <DialogTitle className="flex items-center gap-2">
                <Handshake className="h-4 w-4 text-brand-rose" />
                Open {tokenName ?? "this asset"} for sponsorship
              </DialogTitle>
              <DialogDescription>Set your terms and let sponsors come to you. You choose which bid to accept — nothing happens without your say-so.</DialogDescription>
              <div className="space-y-4">
                <LicenseTermsBuilder
                  value={terms}
                  onChange={setTerms}
                  tokenOptions={TOKEN_SYMBOLS}
                  amountLabel="Minimum accepted bid"
                  disabled={busy}
                />
                <Button type="button" size="lg" className="w-full rounded-xl bg-brand-rose hover:brightness-110 text-white" disabled={busy} onClick={onSubmit}>
                  {busy
                    ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Creating…</>
                    : <><Handshake className="h-4 w-4 mr-2" />Create offer</>}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
      <PinDialog {...action.pinDialogProps} title="Create sponsorship offer" description="Enter your PIN to publish this onchain." />
      <WalletSetupGate action={action} />
    </>
  );
}
