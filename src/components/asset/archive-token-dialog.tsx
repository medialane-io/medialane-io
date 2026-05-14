"use client";

import { useEffect, useState } from "react";
import { Archive, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Contract } from "starknet";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { TxStatus } from "@/components/chipi/tx-status";
import { WalletSetupDialog } from "@/components/chipi/wallet-setup-dialog";
import { useAuth } from "@clerk/nextjs";
import { isWebAuthnSupported } from "@chipi-stack/nextjs";
import { usePasskeyAuth } from "@chipi-stack/chipi-passkey/hooks";
import { IPCollectionABI } from "@medialane/sdk";
import { useSessionKey } from "@/hooks/use-session-key";
import { useChipiTransaction } from "@/hooks/use-chipi-transaction";
import { useMarketplaceActionFlow } from "@/hooks/use-marketplace-action-flow";
import {
  MarketplaceErrorState,
  MarketplacePinStep,
} from "@/components/marketplace/marketplace-dialog-primitives";
import { EXPLORER_URL, COLLECTION_721_CONTRACT } from "@/lib/constants";
import { starknetProvider } from "@/lib/starknet";

interface ArchiveTokenDialogProps {
  /** On-chain numeric collection ID (decimal string). */
  collectionId: string;
  /** Numeric token ID within the collection (decimal string). */
  tokenId: string;
  /** Display name for the toast/success state. */
  tokenName?: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onArchived?: () => void;
}

/**
 * Permanent token archive flow against the audited MIP IPCollection.
 * Archive is non-destructive — the legal record (creator, mint date, URI)
 * stays readable forever, but the token can no longer be transferred or sold.
 */
export function ArchiveTokenDialog({
  collectionId,
  tokenId,
  tokenName,
  open,
  onOpenChange,
  onArchived,
}: ArchiveTokenDialogProps) {
  const { isSignedIn } = useAuth();
  const { hasWallet, hasActiveSession, setupSession } = useSessionKey();
  const { executeTransaction, status, statusMessage, txHash, error, reset, isSubmitting } =
    useChipiTransaction();

  const [acknowledged, setAcknowledged] = useState(false);
  const [passkeySupported] = useState(
    () => typeof window !== "undefined" && isWebAuthnSupported()
  );
  const { authenticate, encryptKey } = usePasskeyAuth();

  const {
    walletSetupOpen,
    setWalletSetupOpen,
    setPendingValues,
    pin,
    setPin,
    pinError,
    setPinError,
    isAuthenticatingPasskey,
    handlePin,
    handleUsePasskey,
    resetActionFlow,
  } = useMarketplaceActionFlow<{ tokenKey: string }>({
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
      const call = contract.populate("archive", [values.tokenKey]);
      const calldata = Array.isArray(call.calldata)
        ? (call.calldata as unknown as string[]).map(String)
        : [];
      await executeTransaction({
        pin: pinOrDerivedKey,
        contractAddress: COLLECTION_721_CONTRACT,
        calls: [
          {
            contractAddress: COLLECTION_721_CONTRACT,
            entrypoint: "archive",
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
      setAcknowledged(false);
      setPendingValues({ tokenKey: `${collectionId}:${tokenId}` });
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleClose = (next: boolean) => {
    if (!isSubmitting) onOpenChange(next);
  };

  const isSuccess = status === "confirmed" && !error;
  const isTerminalError = !isSubmitting && !!error && !!txHash;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-[calc(100%-6px)] sm:max-w-md p-0 overflow-hidden gap-0 rounded-2xl">
        <DialogTitle className="sr-only">Archive {tokenName ?? "token"}</DialogTitle>
        <DialogDescription className="sr-only">
          Archive this token permanently. The legal record is preserved but the token can no longer be transferred.
        </DialogDescription>

        {isSuccess ? (
          <div className="flex flex-col items-center gap-5 p-6 py-8">
            <div className="h-16 w-16 rounded-full bg-emerald-500/15 flex items-center justify-center">
              <CheckCircle2 className="h-9 w-9 text-emerald-500" />
            </div>
            <div className="text-center space-y-1">
              <p className="font-bold text-xl">Token archived</p>
              <p className="text-sm text-muted-foreground">
                The legal record is preserved on-chain forever.
              </p>
            </div>
            <Button
              className="w-full"
              onClick={() => {
                onOpenChange(false);
                onArchived?.();
              }}
            >
              Done
            </Button>
          </div>
        ) : isTerminalError ? (
          <MarketplaceErrorState
            tokenImage={null}
            name={tokenName ?? "Token"}
            title="Archive failed"
            description="The transaction was submitted, but the token could not be archived."
            error={error}
            txHash={txHash}
            explorerUrl={EXPLORER_URL}
            onRetry={() => reset()}
            onDone={() => onOpenChange(false)}
          />
        ) : isSubmitting ? (
          <div className="p-6">
            <TxStatus
              status={status}
              txHash={txHash}
              error={error}
              statusMessage={statusMessage}
            />
          </div>
        ) : !acknowledged ? (
          // Step 1: acknowledgement
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Archive className="h-5 w-5 text-amber-500" />
              <p className="font-bold text-lg">Archive this token?</p>
            </div>

            <div className="rounded-md bg-amber-500/10 border border-amber-500/20 p-3 text-xs flex gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p>
                  <strong>Archive is not burn.</strong> The token is not destroyed.
                </p>
                <p>After archiving:</p>
                <ul className="list-disc list-inside space-y-0.5 text-muted-foreground">
                  <li>The token can no longer be transferred or sold.</li>
                  <li>
                    The creator, mint date, and metadata stay readable on-chain forever (Berne
                    Convention).
                  </li>
                  <li>This action cannot be reversed.</li>
                </ul>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button variant="ghost" className="flex-1" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={() => setAcknowledged(true)}
              >
                I understand, continue
              </Button>
            </div>
          </div>
        ) : (
          // Step 2: PIN / passkey
          <MarketplacePinStep
            description="Enter your PIN to sign the archive transaction. Archived tokens can no longer be transferred."
            pin={pin}
            onPinChange={(value) => {
              setPin(value);
              setPinError(null);
            }}
            pinError={pinError}
            error={error}
            secondaryLabel="Back"
            onSecondary={() => {
              setAcknowledged(false);
              setPin("");
              setPinError(null);
            }}
            primaryLabel="Archive token"
            onPrimary={handlePin}
            primaryDisabled={pin.length < 6}
            primaryVariant="destructive"
            primaryIcon={<Archive className="h-4 w-4" />}
            passkeySupported={passkeySupported && !!encryptKey}
            isAuthenticatingPasskey={isAuthenticatingPasskey}
            onUsePasskey={handleUsePasskey}
          />
        )}
      </DialogContent>
      <WalletSetupDialog
        open={walletSetupOpen}
        onOpenChange={setWalletSetupOpen}
        onSuccess={() => setWalletSetupOpen(false)}
      />
    </Dialog>
  );
}
