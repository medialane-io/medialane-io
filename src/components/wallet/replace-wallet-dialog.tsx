"use client";

import { useState } from "react";
import { CheckCircle2, RefreshCw } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@medialane/ui/dialog";
import { AddressDisplay, MarketplaceConfirmStep, MarketplaceProcessingState, describeError, IconTile } from "@medialane/ui";
import { Button } from "@medialane/ui/button";
import type { DeploymentStep } from "@medialane/sdk/starknet";
import { useSession } from "@medialane/ui/utils/use-session";
import { mediaWallet } from "@/lib/wallet/client";
import { useT, msg } from "@medialane/ui/i18n";

const STEP_LABEL: Record<DeploymentStep, string> = {
  "creating-passkey": msg("Creating passkey…"),
  deploying: msg("Setting up the wallet…"),
};

const WARNING =
  "Replaces the active wallet.";

interface ReplaceWalletDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ReplaceWalletDialog({ open, onOpenChange }: ReplaceWalletDialogProps) {
  const t = useT();
  const { session } = useSession();
  const [step, setStep] = useState<DeploymentStep | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [newAddress, setNewAddress] = useState<string | null>(null);

  const generate = async () => {
    setError(null);
    if (!session) {
      setError("Sign in to generate a wallet.");
      return;
    }
    try {
      const { sealed } = await mediaWallet.completeDeployment(setStep, { replace: true });
      setNewAddress(sealed.address);
    } catch (err) {
      setError(describeError(err).message);
    } finally {
      setStep(null);
    }
  };

  const close = () => {
    if (newAddress) {
      window.location.reload();
      return;
    }
    setError(null);
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
        <DialogTitle className="sr-only">{t("Generate new wallet")}</DialogTitle>
        <DialogDescription className="sr-only">{newAddress ? t("Account secured with a new contract onchain") : WARNING}</DialogDescription>

        {newAddress ? (
          <div className="flex flex-col items-center gap-5 p-6 py-8">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10">
              <CheckCircle2 className="h-9 w-9 text-emerald-500" />
            </div>
            <div className="space-y-1 text-center">
              <p className="text-xl font-bold">{t("New wallet active")}</p>
              <p className="text-sm text-muted-foreground">{t("Account secured with a new contract onchain")}</p>
            </div>
            <AddressDisplay address={newAddress} chars={33} showCopy className="break-all text-xs" />
            <Button className="w-full h-11" onClick={close}>
              {t("Done")}
            </Button>
          </div>
        ) : step ? (
          <MarketplaceProcessingState title={t(STEP_LABEL[step])} />
        ) : (
          <>
            <div className="flex flex-col items-center gap-3 px-6 pt-8">
              <IconTile size="lg" destructive>
                <RefreshCw />
              </IconTile>
              <p aria-hidden className="text-xl font-bold">{t("Generate new wallet")}</p>
            </div>
            <MarketplaceConfirmStep
              description={WARNING}
              error={error}
              secondaryLabel={t("Cancel")}
              onSecondary={close}
              primaryLabel={t("Generate new wallet")}
              primaryVariant="destructive"
              onPrimary={generate}
            />
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
