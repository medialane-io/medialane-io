"use client";

import { useEffect } from "react";
import { ShieldCheck } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { WalletSetupDialog } from "@/components/chipi/wallet-setup-dialog";
import { useAuth } from "@clerk/nextjs";
import { CurrencyIcon } from "@/components/shared/currency-icon";
import { useMarketplace } from "@/hooks/use-marketplace";
import { useMarketplaceActionFlow } from "@/hooks/use-marketplace-action-flow";
import { MarketplacePinStep } from "@/components/marketplace/marketplace-dialog-primitives";
import { TransactionDialogStates } from "@/components/marketplace/transaction-dialog-states";
import { ipfsToHttp, formatDisplayPrice } from "@/lib/utils";
import { useWalletAuthMethod } from "@/hooks/use-wallet-auth-method";
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

  // Authoritative passkey-vs-PIN (cross-device), not just device-local WebAuthn support.
  const { usesPasskey, authenticate, encryptKey } = useWalletAuthMethod();
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

  const resolvedName = order?.token?.name ?? tokenName ?? "Asset";

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-[calc(100%-6px)] sm:max-w-md p-0 overflow-hidden gap-0 rounded-2xl">
        <DialogTitle className="sr-only">Cancel {resolvedVariant} for {resolvedName}</DialogTitle>
        <DialogDescription className="sr-only">
          Enter your PIN to cancel this {resolvedVariant}. This action cannot be undone.
        </DialogDescription>

        <TransactionDialogStates
          status={txStatus}
          statusMessage={
            txStatus === "submitting" ? "Submitting cancellation…" : "Confirming onchain…"
          }
          txHash={txHash}
          error={error}
          isSubmitting={isProcessing || txStatus === "confirming"}
          successTitle={`${resolvedVariant.charAt(0).toUpperCase()}${resolvedVariant.slice(1)} cancelled`}
          successBody={
            <>
              Your {resolvedVariant} for{" "}
              <span className="font-medium text-foreground">{resolvedName}</span>{" "}
              has been removed.
            </>
          }
          successImage={order?.token?.image ?? tokenImage ?? null}
          successImageAlt={resolvedName}
          errorTitle={`${resolvedVariant === "listing" ? "Listing" : "Offer"} cancellation failed`}
          errorDescription={`The transaction was submitted, but this ${resolvedVariant} could not be cancelled.`}
          errorAssetName={resolvedName}
          errorAssetImage={order?.token?.image ? ipfsToHttp(order.token.image) : tokenImage ?? null}
          onRetry={() => resetState()}
          onDone={() => { onOpenChange(false); onSuccess?.(); }}
        >
          {order && (
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
                passkeySupported={usesPasskey}
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
