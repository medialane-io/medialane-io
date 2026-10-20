"use client";

import { useEffect, useState } from "react";
import { UserRoundCog } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@medialane/ui/dialog";
import { Button } from "@medialane/ui/button";
import { Input } from "@medialane/ui/input";
import { Label } from "@medialane/ui/label";
import { useWalletNativeSession } from "@/hooks/use-wallet-native-session";
import { useWalletWriteAction } from "@/hooks/use-wallet-write-action";
import { MarketplaceConfirmStep, runIntentCalls } from "@medialane/ui";
import { TransactionDialogStates } from "@/components/marketplace/transaction-dialog-states";
import { normalizeAddress } from "@medialane/sdk";
import { getMedialaneClient } from "@/lib/medialane-client";

interface TransferOwnershipDialogProps {

  collectionId: string;
  currentOwner: string;
  collectionName?: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTransferred?: () => void;
}

export function TransferCollectionOwnershipDialog({
  collectionId,
  currentOwner,
  collectionName,
  open,
  onOpenChange,
  onTransferred,
}: TransferOwnershipDialogProps) {
  const { hasWallet } = useWalletNativeSession();
  const action = useWalletWriteAction();

  const [newOwner, setNewOwner] = useState("");
  const [step, setStep] = useState<"form" | "confirm">("form");

  const trimmed = newOwner.trim();
  const isValid = /^0x[0-9a-fA-F]{1,64}$/.test(trimmed);
  const wouldNoop =
    isValid && normalizeAddress("STARKNET", trimmed) === normalizeAddress("STARKNET", currentOwner);

  useEffect(() => {
    if (open) {
      action.reset();
      setNewOwner("");
      setStep("form");
    }
    
  }, [open]);

  const isSubmitting = action.status === "processing" || action.status === "confirming";
  const handleClose = (next: boolean) => {
    if (!isSubmitting) onOpenChange(next);
  };

  const submitForm = () => {
    if (!isValid || wouldNoop) return;
    setStep("confirm");
  };

  const handleConfirmTransfer = () => {
    void action.run(async (signer) => {
      return runIntentCalls(signer, () =>
        getMedialaneClient().api.createTransferCollectionOwnershipIntent({ owner: signer.address, collectionId: String(collectionId), newOwner: trimmed }),
      );
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-[calc(100%-6px)] sm:max-w-md p-0 overflow-hidden gap-0 rounded-2xl">
        <DialogTitle className="sr-only">
          Transfer ownership of {collectionName ?? "collection"}
        </DialogTitle>
        <DialogDescription className="sr-only">
          Transfer the on-chain owner of this collection. Existing tokens are unaffected.
        </DialogDescription>

        <TransactionDialogStates
          status={action.status}
          statusMessage="Confirming onchain…"
          txHash={action.txHash}
          error={action.error}
          isSubmitting={isSubmitting}
          successTitle="Ownership transferred"
          successBody={
            <span className="tabular-nums">
              New owner: {trimmed.slice(0, 6)}…{trimmed.slice(-4)}
            </span>
          }
          errorTitle="Transfer failed"
          errorDescription="The transaction was submitted, but ownership could not be transferred."
          errorAssetName={collectionName ?? "Collection"}
          onRetry={() => action.reset()}
          onDone={() => {
            onOpenChange(false);
            onTransferred?.();
          }}
        >
          {step === "form" ? (
            <div className="p-6 space-y-4">
            <div className="flex items-center gap-2">
              <UserRoundCog className="h-5 w-5" />
              <p className="font-bold text-lg">Transfer collection ownership</p>
            </div>
            <p className="text-sm text-muted-foreground">
              The new owner will control minting and future ownership transfers for this
              collection. Existing tokens are unaffected.
            </p>

            <div className="space-y-2">
              <Label htmlFor="new-owner">New owner address</Label>
              <Input
                id="new-owner"
                placeholder="0x…"
                value={newOwner}
                onChange={(e) => setNewOwner(e.target.value)}
                className="tabular-nums text-sm"
                spellCheck={false}
                autoComplete="off"
              />
              {trimmed && !isValid && (
                <p className="text-xs text-red-500">Not a valid Starknet address.</p>
              )}
              {wouldNoop && (
                <p className="text-xs text-amber-500">This is already the current owner.</p>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <Button variant="ghost" className="flex-1" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={submitForm}
                disabled={!isValid || wouldNoop || !hasWallet}
              >
                Continue
              </Button>
            </div>
          </div>
        ) : (

          <MarketplaceConfirmStep
            description={`Transfer ownership to ${trimmed.slice(0, 6)}…${trimmed.slice(-4)}?`}
            error={action.error}
            secondaryLabel="Back"
            onSecondary={() => setStep("form")}
            primaryLabel="Transfer ownership"
            onPrimary={handleConfirmTransfer}
            primaryIcon={<UserRoundCog className="h-4 w-4" />}
          />
          )}
        </TransactionDialogStates>
      </DialogContent>
    </Dialog>
  );
}
