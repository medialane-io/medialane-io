"use client";

import { useState } from "react";
import { CheckCircle2, KeyRound } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@medialane/ui/dialog";
import { Input } from "@medialane/ui/input";
import { AddressDisplay, MarketplaceConfirmStep, MarketplaceProcessingState, describeError } from "@medialane/ui";
import { Button } from "@medialane/ui/button";
import { InvalidRecoveryKeyError, parseRecoveryKey, signRecoveryKeyProof } from "@medialane/sdk/starknet";
import { useSession } from "@medialane/ui/utils/use-session";
import { MEDIALANE_BACKEND_URL } from "@/lib/constants";
import { getMedialaneClient } from "@/lib/medialane-client";
import { isOwnerOf } from "@/lib/wallet/devices";
import { sealImportedOwnerKey } from "@/lib/wallet/passkey";
import { notifyWalletChange, saveSealedOwner } from "@/lib/wallet/store";

type Step = "creating-passkey" | "securing";

const STEP_LABEL: Record<Step, string> = {
  "creating-passkey": "Creating passkey…",
  securing: "Setting up the wallet…",
};

const WARNING =
  "This permanently replaces the active wallet on this account. This cannot be undone, make sure to transfer your assets before replace the wallet.";

interface RecoverWalletDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RecoverWalletDialog({ open, onOpenChange }: RecoverWalletDialogProps) {
  const { session } = useSession();
  const [keyInput, setKeyInput] = useState("");
  const [step, setStep] = useState<Step | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [recoveredAddress, setRecoveredAddress] = useState<string | null>(null);

  const preview = (() => {
    const trimmed = keyInput.trim();
    if (!trimmed) return null;
    try {
      return parseRecoveryKey(trimmed);
    } catch {
      return null;
    }
  })();

  const recover = async () => {
    setError(null);
    if (!session) {
      setError("Sign in to recover a wallet.");
      return;
    }
    try {
      const recovery = parseRecoveryKey(keyInput);
      setStep("creating-passkey");
      const sealed = await sealImportedOwnerKey(recovery);
      const owned = await isOwnerOf(sealed.address, sealed.ownerPubKey).catch(() => false);
      if (!owned) {
        setError("That key does not open this wallet. Check the whole recovery key was copied.");
        return;
      }
      setStep("securing");
      const proof = await signRecoveryKeyProof({ backendUrl: MEDIALANE_BACKEND_URL, key: recovery });
      await getMedialaneClient().api.account.recoverWalletWithKey(proof);
      saveSealedOwner(sealed);
      notifyWalletChange();
      setRecoveredAddress(sealed.address);
    } catch (err) {
      setError(
        err instanceof InvalidRecoveryKeyError
          ? "That does not look like a recovery key. Check all of it was copied."
          : describeError(err).message,
      );
    } finally {
      setStep(null);
    }
  };

  const close = () => {
    if (recoveredAddress) {
      window.location.reload();
      return;
    }
    setError(null);
    setKeyInput("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !step && (next ? onOpenChange(true) : close())}>
      <DialogContent
        className="max-w-[calc(100%-6px)] sm:max-w-md p-0 overflow-hidden gap-0 rounded-2xl"
        onInteractOutside={step ? (e) => e.preventDefault() : undefined}
        onEscapeKeyDown={step ? (e) => e.preventDefault() : undefined}
        {...(step ? { hideClose: true } : {})}
      >
        <DialogTitle className="sr-only">Recover with your key</DialogTitle>
        <DialogDescription className="sr-only">
          {recoveredAddress ? "Account secured with the recovered wallet" : WARNING}
        </DialogDescription>

        {recoveredAddress ? (
          <div className="flex flex-col items-center gap-5 p-6 py-8">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10">
              <CheckCircle2 className="h-9 w-9 text-emerald-500" />
            </div>
            <div className="space-y-1 text-center">
              <p className="text-xl font-bold">Wallet recovered</p>
              <p className="text-sm text-muted-foreground">Account secured with the recovered wallet</p>
            </div>
            <AddressDisplay address={recoveredAddress} chars={33} showCopy className="break-all text-xs" />
            <Button className="w-full h-11" onClick={close}>
              Done
            </Button>
          </div>
        ) : step ? (
          <MarketplaceProcessingState title={STEP_LABEL[step]} />
        ) : (
          <>
            <div className="flex flex-col items-center gap-3 px-6 pt-8">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-violet-500/10">
                <KeyRound className="h-8 w-8 text-violet-600 dark:text-violet-400" />
              </div>
              <p className="text-xl font-bold">Recover with your key</p>
            </div>
            <MarketplaceConfirmStep
              summary={
                <div className="space-y-2">
                  <Input
                    value={keyInput}
                    onChange={(e) => setKeyInput(e.target.value)}
                    placeholder="medialane-recovery:v1:…"
                    autoComplete="off"
                    spellCheck={false}
                    aria-label="Recovery key"
                    className="font-mono text-xs"
                  />
                  {preview ? (
                    <AddressDisplay address={preview.walletAddress} chars={33} className="break-all text-xs" />
                  ) : null}
                </div>
              }
              description={WARNING}
              error={error}
              secondaryLabel="Cancel"
              onSecondary={close}
              primaryLabel="Recover wallet"
              primaryDisabled={!preview}
              onPrimary={recover}
            />
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
