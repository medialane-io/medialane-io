"use client";

import { useEffect, useState } from "react";
import { UserRoundCog } from "lucide-react";
import { Contract, cairo } from "starknet";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { WalletSetupDialog } from "@/components/chipi/wallet-setup-dialog";
import { useAuth } from "@clerk/nextjs";
import { isWebAuthnSupported } from "@chipi-stack/nextjs";
import { usePasskeyAuth } from "@chipi-stack/chipi-passkey/hooks";
import { IPCollectionABI } from "@medialane/sdk";
import { useSessionKey } from "@/hooks/use-session-key";
import { useChipiTransaction } from "@/hooks/use-chipi-transaction";
import { useMarketplaceActionFlow } from "@/hooks/use-marketplace-action-flow";
import { MarketplacePinStep } from "@/components/marketplace/marketplace-dialog-primitives";
import { TransactionDialogStates } from "@/components/marketplace/transaction-dialog-states";
import { COLLECTION_721_CONTRACT } from "@/lib/constants";
import { starknetProvider } from "@/lib/starknet";
import { normalizeAddress } from "@/lib/utils";

interface TransferOwnershipDialogProps {
  /** On-chain numeric collection ID (decimal string). */
  collectionId: string;
  currentOwner: string;
  collectionName?: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTransferred?: () => void;
}

/**
 * Per-collection ownership handoff via the audited IPCollection registry.
 * The new owner controls future minting and ownership transfers for this
 * collection only — existing tokens are unaffected.
 */
export function TransferCollectionOwnershipDialog({
  collectionId,
  currentOwner,
  collectionName,
  open,
  onOpenChange,
  onTransferred,
}: TransferOwnershipDialogProps) {
  const { isSignedIn } = useAuth();
  const { hasWallet, hasActiveSession, setupSession } = useSessionKey();
  const { executeTransaction, status, statusMessage, txHash, error, reset, isSubmitting } =
    useChipiTransaction();

  const [newOwner, setNewOwner] = useState("");
  const [passkeySupported] = useState(
    () => typeof window !== "undefined" && isWebAuthnSupported()
  );
  const { authenticate, encryptKey } = usePasskeyAuth();

  const trimmed = newOwner.trim();
  const isValid = /^0x[0-9a-fA-F]{1,64}$/.test(trimmed);
  const wouldNoop =
    isValid && normalizeAddress(trimmed) === normalizeAddress(currentOwner);

  const {
    walletSetupOpen,
    setWalletSetupOpen,
    setPendingValues,
    pin,
    setPin,
    pinError,
    setPinError,
    step,
    setStep,
    isAuthenticatingPasskey,
    beginAction,
    handlePin,
    handleUsePasskey,
    resetActionFlow,
  } = useMarketplaceActionFlow<{ newOwner: string }>({
    isSignedIn,
    hasWallet,
    hasActiveSession,
    setupSession,
    authenticate,
    encryptKey,
    executeAction: async (values, pinOrDerivedKey) => {
      const contract = new Contract(
        IPCollectionABI as any,
        COLLECTION_721_CONTRACT,
        starknetProvider
      );
      const call = contract.populate("transfer_collection_ownership", [
        cairo.uint256(BigInt(collectionId)),
        values.newOwner,
      ]);
      const calldata = Array.isArray(call.calldata)
        ? (call.calldata as unknown as string[]).map(String)
        : [];
      await executeTransaction({
        pin: pinOrDerivedKey,
        calls: [
          {
            contractAddress: COLLECTION_721_CONTRACT,
            entrypoint: "transfer_collection_ownership",
            calldata,
          },
        ],
      });
    },
  });

  useEffect(() => {
    if (open) {
      reset();
      resetActionFlow();
      setNewOwner("");
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleClose = (next: boolean) => {
    if (!isSubmitting) onOpenChange(next);
  };

  const submitForm = () => {
    if (!isValid || wouldNoop) return;
    setPendingValues({ newOwner: trimmed });
    void beginAction({ newOwner: trimmed }, 0);
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
          status={status}
          statusMessage={statusMessage}
          txHash={txHash}
          error={error}
          isSubmitting={isSubmitting}
          successTitle="Ownership transferred"
          successBody={
            <span className="font-mono">
              New owner: {trimmed.slice(0, 6)}…{trimmed.slice(-4)}
            </span>
          }
          errorTitle="Transfer failed"
          errorDescription="The transaction was submitted, but ownership could not be transferred."
          errorAssetName={collectionName ?? "Collection"}
          onRetry={() => reset()}
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
                className="font-mono text-sm"
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
                disabled={!isValid || wouldNoop}
              >
                Continue
              </Button>
            </div>
          </div>
        ) : (
          // step === "pin"
          <MarketplacePinStep
            description={`Enter your PIN to transfer ownership to ${trimmed.slice(0, 6)}…${trimmed.slice(-4)}.`}
            pin={pin}
            onPinChange={(value) => {
              setPin(value);
              setPinError(null);
            }}
            pinError={pinError}
            error={error}
            secondaryLabel="Back"
            onSecondary={() => {
              setStep("form");
              setPin("");
              setPinError(null);
            }}
            primaryLabel="Transfer ownership"
            onPrimary={handlePin}
            primaryDisabled={pin.length < 6}
            primaryIcon={<UserRoundCog className="h-4 w-4" />}
            passkeySupported={passkeySupported && !!encryptKey}
            isAuthenticatingPasskey={isAuthenticatingPasskey}
            onUsePasskey={handleUsePasskey}
          />
          )}
        </TransactionDialogStates>
      </DialogContent>
      <WalletSetupDialog
        open={walletSetupOpen}
        onOpenChange={setWalletSetupOpen}
        onSuccess={() => setWalletSetupOpen(false)}
      />
    </Dialog>
  );
}
