"use client";

import { toast } from "sonner";
import { Loader2, CheckCircle2, Ban, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { PinDialog } from "@/components/chipi/pin-dialog";
import { useWriteAction } from "@/hooks/use-write-action";
import { WalletSetupDialog } from "@/components/chipi/wallet-setup-dialog";
import { MarketplaceErrorState, MarketplaceSuccessState } from "@/components/marketplace/marketplace-dialog-primitives";
import { useSessionKey } from "@/hooks/use-session-key";
import { useUser } from "@clerk/nextjs";
import { useClubMembership } from "@/hooks/use-club";
import { EXPLORER_URL } from "@/lib/constants";
import { getListableTokens } from "@medialane/sdk";

interface ClubJoinButtonProps {
  clubAddress: string;
  entryFee: string;
  paymentToken: string | null;
  open: boolean;
}

function u256CallData(value: bigint): [string, string] {
  const low = (value & BigInt("0xffffffffffffffffffffffffffffffff")).toString();
  const high = (value >> 128n).toString();
  return [low, high];
}

export function ClubJoinButton({ clubAddress, entryFee, paymentToken, open }: ClubJoinButtonProps) {
  const { isSignedIn } = useUser();
  const { walletAddress } = useSessionKey();
  const { isMember, isLoading, mutate } = useClubMembership(clubAddress, walletAddress ?? null);
  const action = useWriteAction();
  const busy = action.status === "processing" || action.status === "confirming";

  const feeBigInt = BigInt(entryFee || "0");
  const isPaid = feeBigInt > 0n && !!paymentToken;
  const knownToken = isPaid
    ? getListableTokens().find((t) => t.address.toLowerCase() === paymentToken!.toLowerCase())
    : null;
  const feeDisplay = isPaid && knownToken
    ? `${Number((feeBigInt * 10000n) / BigInt(10 ** knownToken.decimals)) / 10000} ${knownToken.symbol}`
    : null;

  const handleJoin = () => {
    if (!isSignedIn) {
      toast.error("Sign in to join this club");
      return;
    }
    void action.run(async (secret) => {
      if (!walletAddress) throw new Error("Wallet not ready. Please refresh and try again.");
      // Join = mint a membership card on the club collection. A paid club pulls
      // the entry fee during mint, so approve the collection as spender first.
      const calls: Array<{ contractAddress: string; entrypoint: string; calldata: string[] }> = [];
      if (isPaid) {
        if (!knownToken) throw new Error("Unknown payment token — cannot proceed");
        const [low, high] = u256CallData(feeBigInt);
        calls.push({ contractAddress: paymentToken!, entrypoint: "approve", calldata: [clubAddress, low, high] });
      }
      calls.push({ contractAddress: clubAddress, entrypoint: "mint", calldata: [walletAddress] });

      const result = await action.executeTransaction({ pin: secret, calls });
      if (result.status === "confirmed") mutate();
      return result;
    });
  };

  if (!open) {
    return (
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Ban className="h-3.5 w-3.5 shrink-0" />
        Not open for new members
      </div>
    );
  }

  if (isLoading) {
    return (
      <Button variant="outline" size="sm" disabled className="w-full">
        <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
        Checking membership…
      </Button>
    );
  }

  if (isMember) {
    return (
      <div className="flex items-center gap-1.5 text-sm text-indigo-500 font-medium">
        <CheckCircle2 className="h-4 w-4 shrink-0" />
        You&apos;re a member
      </div>
    );
  }

  return (
    <>
      <Button size="sm" className="w-full gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white" onClick={handleJoin} disabled={busy}>
        {busy ? (
          <><Loader2 className="h-3.5 w-3.5 animate-spin" />Joining…</>
        ) : (
          <><Users className="h-3.5 w-3.5" />{feeDisplay ? `Join for ${feeDisplay}` : "Join free"}</>
        )}
      </Button>

      <PinDialog
        {...action.pinDialogProps}
        title={feeDisplay ? `Join for ${feeDisplay}` : "Join this club"}
        description={
          isPaid
            ? "This will approve the entry fee and mint your membership card. Enter your PIN to confirm."
            : "Enter your PIN to mint your membership card onchain."
        }
      />

      <WalletSetupDialog open={action.walletSetupOpen} onOpenChange={action.setWalletSetupOpen} />

      <Dialog open={action.status === "success" || action.status === "error"} onOpenChange={(open) => { if (!open) action.reset(); }}>
        <DialogContent className="max-w-[calc(100%-6px)] sm:max-w-md p-0 overflow-hidden gap-0 rounded-2xl">
          <DialogTitle className="sr-only">
            {action.status === "success" ? "Joined club" : "Join failed"}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Review the result of your join-club transaction.
          </DialogDescription>
          {action.status === "success" ? (
            <MarketplaceSuccessState
              name="Membership"
              title="You're in!"
              description="Your membership card is now on-chain."
              txHash={action.txHash}
              explorerUrl={EXPLORER_URL}
              onDone={action.reset}
            />
          ) : action.status === "error" ? (
            <MarketplaceErrorState
              name="Membership"
              title="Join failed"
              description="Joining this club could not be completed."
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
