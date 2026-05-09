"use client";

import { useEffect } from "react";
import { CheckCircle2, ShieldCheck } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { TxStatus } from "@/components/chipi/tx-status";
import { WalletSetupDialog } from "@/components/chipi/wallet-setup-dialog";
import { useAuth } from "@clerk/nextjs";
import { CurrencyIcon } from "@/components/shared/currency-icon";
import { useMarketplace } from "@/hooks/use-marketplace";
import { useMarketplaceActionFlow } from "@/hooks/use-marketplace-action-flow";
import { MarketplaceErrorState, MarketplacePinStep } from "@/components/marketplace/marketplace-dialog-primitives";
import { EXPLORER_URL } from "@/lib/constants";
import { ipfsToHttp, formatDisplayPrice } from "@/lib/utils";
import { useState } from "react";
import { isWebAuthnSupported } from "@chipi-stack/nextjs";
import { usePasskeyAuth } from "@chipi-stack/chipi-passkey/hooks";
import type { ApiOrder } from "@medialane/sdk";

interface CancelOrderDialogProps {
  order: ApiOrder | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  /** Controls the label shown — auto-detected from order type if omitted. */
  variant?: "listing" | "offer";
  /** Fallback token name when order.token is not enriched. */
  tokenName?: string | null;
  /** Fallback token image when order.token is not enriched. */
  tokenImage?: string | null;
}

function TokenHero({ order, variant, tokenName, tokenImage }: { order: ApiOrder; variant: "listing" | "offer"; tokenName?: string | null; tokenImage?: string | null }) {
  const rawImage = order.token?.image ?? tokenImage ?? null;
  const image = rawImage ? ipfsToHttp(rawImage) : null;
  const name = order.token?.name ?? tokenName ?? null;

  return (
    <div>
      <div className="relative h-32 w-full bg-muted overflow-hidden">
        {image ? (
          <img src={image} alt={name ?? "Asset"} className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-destructive/20 via-rose-500/10 to-transparent" />
        )}
      </div>
      <div className="flex items-end justify-between px-6 pt-3 pb-1">
        <div className="min-w-0">
          <p className="font-bold text-lg leading-tight truncate">{name ?? "Asset"}</p>
          <p className="text-xs text-muted-foreground mt-0.5 capitalize">
            Cancel {variant}
          </p>
        </div>
        {order.price && (
          <div className="shrink-0 text-right ml-4">
            <p className="flex items-center gap-1.5 font-bold text-xl justify-end">
              <CurrencyIcon symbol={order.price.currency} size={16} />
              {formatDisplayPrice(order.price.formatted)}
            </p>
            <p className="text-xs text-muted-foreground">{order.price.currency}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export function CancelOrderDialog({
  order,
  open,
  onOpenChange,
  onSuccess,
  variant,
  tokenName,
  tokenImage,
}: CancelOrderDialogProps) {
  const { isSignedIn } = useAuth();
  const {
    cancelOrder,
    hasWallet,
    hasActiveSession,
    setupSession,
    isProcessing,
    txStatus,
    txHash,
    error,
    resetState,
  } = useMarketplace();

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
  } = useMarketplaceActionFlow<{ orderHash: string; tokenStandard: string }>({
    isSignedIn,
    hasWallet,
    hasActiveSession,
    setupSession,
    authenticate,
    encryptKey,
    executeAction: async (values, pinOrDerivedKey) => {
      await cancelOrder({
        orderHash: values.orderHash,
        pin: pinOrDerivedKey,
        tokenStandard: values.tokenStandard,
      });
    },
  });

  const resolvedVariant: "listing" | "offer" =
    variant ?? (order?.offer.itemType === "ERC721" || order?.offer.itemType === "ERC1155" ? "listing" : "offer");

  useEffect(() => {
    if (open) {
      resetState();
      resetActionFlow();
      if (order) {
        setPendingValues({
          orderHash: order.orderHash,
          tokenStandard: order.offer.itemType,
        });
      }
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleClose = (v: boolean) => {
    if (!isProcessing) onOpenChange(v);
  };

  const isSuccess = !isProcessing && txStatus === "confirmed" && !error;
  const isTerminalError = !isProcessing && !!error && !!txHash;

  const resolvedName = order?.token?.name ?? tokenName ?? "Asset";

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-[calc(100%-6px)] sm:max-w-md p-0 overflow-hidden gap-0 rounded-2xl">
        <DialogTitle className="sr-only">Cancel {resolvedVariant} for {resolvedName}</DialogTitle>
        <DialogDescription className="sr-only">
          Enter your PIN to cancel this {resolvedVariant}. This action cannot be undone.
        </DialogDescription>

        {/* ── Success ── */}
        {isSuccess ? (
          <div className="flex flex-col items-center gap-5 p-6 py-8">
            <div className="h-16 w-16 rounded-full bg-emerald-500/15 flex items-center justify-center">
              <CheckCircle2 className="h-9 w-9 text-emerald-500" />
            </div>
            {(order?.token?.image ?? tokenImage) && (
              <div className="h-24 w-24 rounded-2xl overflow-hidden border border-border shadow-md">
                <img
                  src={ipfsToHttp(order?.token?.image ?? tokenImage!)}
                  alt={resolvedName}
                  className="h-full w-full object-cover"
                />
              </div>
            )}
            <div className="text-center space-y-1">
              <p className="font-bold text-xl capitalize">{resolvedVariant} cancelled</p>
              <p className="text-sm text-muted-foreground">
                Your {resolvedVariant} for{" "}
                <span className="font-medium text-foreground">{resolvedName}</span>{" "}
                has been removed.
              </p>
            </div>
            <Button
              className="w-full"
              onClick={() => { onOpenChange(false); onSuccess?.(); }}
            >
              Done
            </Button>
          </div>

        ) : isTerminalError ? (
          <MarketplaceErrorState
            tokenImage={order?.token?.image ? ipfsToHttp(order.token.image) : tokenImage ?? null}
            name={resolvedName}
            title={`${resolvedVariant === "listing" ? "Listing" : "Offer"} cancellation failed`}
            description={`The transaction was submitted, but this ${resolvedVariant} could not be cancelled.`}
            error={error}
            txHash={txHash}
            explorerUrl={EXPLORER_URL}
            onRetry={() => resetState()}
            onDone={() => onOpenChange(false)}
          />

        ) : (isProcessing || txStatus === "confirming") ? (
          /* ── Processing ── */
          <div className="p-6">
            <TxStatus
              status={txStatus}
              txHash={txHash}
              error={error}
              statusMessage={
                txStatus === "submitting"
                  ? `Submitting cancellation…`
                  : "Confirming on Starknet…"
              }
            />
          </div>

        ) : (
          /* ── PIN entry ── */
          order && (
            <div className="space-y-0">
              <TokenHero order={order} variant={resolvedVariant} tokenName={tokenName} tokenImage={tokenImage} />
              <MarketplacePinStep
                description={`Enter your PIN to cancel this ${resolvedVariant}. This action cannot be undone.`}
                pin={pin}
                onPinChange={(value) => { setPin(value); setPinError(null); }}
                pinError={pinError}
                error={error}
                secondaryLabel="Keep it"
                onSecondary={() => onOpenChange(false)}
                primaryLabel={`Cancel ${resolvedVariant}`}
                onPrimary={handlePin}
                primaryDisabled={pin.length < 6}
                primaryVariant="destructive"
                passkeySupported={passkeySupported && !!encryptKey}
                isAuthenticatingPasskey={isAuthenticatingPasskey}
                onUsePasskey={handleUsePasskey}
                footer={(
                  <div className="flex items-start justify-center gap-1.5">
                    <ShieldCheck className="h-3 w-3 text-muted-foreground shrink-0 mt-0.5" />
                    <p className="text-[10px] text-center text-muted-foreground">
                      Cancellation is recorded onchain — the order is permanently removed from the marketplace. Gas is sponsored by Medialane.
                    </p>
                  </div>
                )}
              />
            </div>
          )
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
