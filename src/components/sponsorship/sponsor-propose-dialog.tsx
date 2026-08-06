"use client";

import { useState } from "react";
import { Handshake, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { useWalletWriteAction } from "@/hooks/use-wallet-write-action";
import { useWalletNativeSession } from "@/hooks/use-wallet-native-session";
import { useMedialaneClient } from "@/hooks/use-medialane-client";
import { executeIntent } from "@/lib/wallet/intent-tx";
import { LicenseTermsBuilder, EMPTY_SPONSORSHIP_TERMS, toLicenseMetadata, toDurationDays, type SponsorshipTerms } from "@medialane/ui";
import { getTokenBySymbol, SUPPORTED_TOKENS } from "@medialane/sdk";
import { pinSponsorshipTerms } from "@/lib/launchpad-metadata";
import { useSiwsToken } from "@/hooks/use-siws-token";
import { toast } from "sonner";

const LISTABLE_TOKENS = SUPPORTED_TOKENS.filter((t) => t.listable);
const TOKEN_SYMBOLS = LISTABLE_TOKENS.map((t) => t.symbol);

interface SponsorProposeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nftContract: string;
  tokenId: string;
  tokenName?: string;
  onSuccess?: () => void;
}

export function SponsorProposeDialog({
  open, onOpenChange, nftContract, tokenId, tokenName, onSuccess,
}: SponsorProposeDialogProps) {
  const action = useWalletWriteAction();
  const busy = action.status === "processing" || action.status === "confirming";
  const { address: walletAddress } = useWalletNativeSession();
  const { getValidToken, signIn } = useSiwsToken();
  const client = useMedialaneClient();
  const [terms, setTerms] = useState<SponsorshipTerms>({ ...EMPTY_SPONSORSHIP_TERMS, paymentTokenSymbol: "USDC" });

  const onSubmit = () => {
    if (!walletAddress) { toast.error("Account not ready. Please refresh and try again."); return; }
    if (!terms.amount || Number(terms.amount) <= 0) { toast.error("Add an amount before continuing"); return; }
    const token = getTokenBySymbol(terms.paymentTokenSymbol);
    if (!token) { toast.error("Pick a currency"); return; }
    const durationDays = toDurationDays(terms);
    if (!durationDays) { toast.error("How long should the license last?"); return; }

    void action.run(async (signer) => {
      const siwsToken = getValidToken() ?? (await signIn());
      if (!siwsToken) throw new Error("Secure your account first");
      const licenseTermsUri = await pinSponsorshipTerms(toLicenseMetadata(terms), siwsToken);

      const amount = BigInt(Math.round(Number(terms.amount) * 10 ** token.decimals));
      const duration = durationDays * 86400;
      const royaltyBps = Math.round(Number(terms.royaltyPercent || "0") * 100);

      const intentRes = await client.api.createSponsorshipProposalIntent({
        proposer: walletAddress,
        nftContract,
        tokenId,
        amount: amount.toString(),
        duration,
        paymentToken: token.address,
        licenseTermsUri,
        transferable: terms.transferable,
        royaltyBps,
      });
      const result = await executeIntent(signer, client, intentRes.data, { confirm: false });
      onSuccess?.();
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
                <DialogTitle>Proposal sent</DialogTitle>
                <DialogDescription>{tokenName ?? "The asset"}&apos;s owner can now accept or decline your proposal.</DialogDescription>
              </div>
              <Button onClick={() => onOpenChange(false)} className="w-full">Close</Button>
            </div>
          ) : (
            <>
              <DialogTitle className="flex items-center gap-2">
                <Handshake className="h-4 w-4 text-brand-rose" />
                Sponsor {tokenName ?? "this IP"}
              </DialogTitle>
              <DialogDescription>Tell the owner what you&apos;re offering. If they accept, you get your license the moment you pay — no escrow, no waiting.</DialogDescription>
              <div className="space-y-4">
                <LicenseTermsBuilder
                  value={terms}
                  onChange={setTerms}
                  tokenOptions={TOKEN_SYMBOLS}
                  amountLabel="Amount you'll pay"
                  disabled={busy}
                />
                <div className="btn-border-animated p-[1px] rounded-2xl">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={onSubmit}
                    className="w-full h-12 rounded-[15px] flex items-center justify-center gap-2 text-base font-semibold text-white bg-transparent transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-50"
                  >
                    {busy
                      ? <><Loader2 className="h-4 w-4 animate-spin" />Sending…</>
                      : <><Handshake className="h-4 w-4" />Send proposal</>}
                  </button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
