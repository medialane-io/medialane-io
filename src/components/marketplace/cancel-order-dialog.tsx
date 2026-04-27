"use client";

import { useEffect } from "react";
import { CheckCircle2, AlertCircle, X } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PinInput } from "@/components/ui/pin-input";
import { TxStatus } from "@/components/chipi/tx-status";
import { WalletSetupDialog } from "@/components/chipi/wallet-setup-dialog";
import { useAuth } from "@clerk/nextjs";
import { CurrencyIcon } from "@/components/shared/currency-icon";
import { useMarketplace } from "@/hooks/use-marketplace";
import { useMarketplaceActionFlow } from "@/hooks/use-marketplace-action-flow";
import { ipfsToHttp, formatDisplayPrice } from "@/lib/utils";
import { useState } from "react";
import Image from "next/image";
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
}

function TokenHero({ order, variant }: { order: ApiOrder; variant: "listing" | "offer" }) {
  const image = order.token?.image ? ipfsToHttp(order.token.image) : null;
  const name = order.token?.name || `Token #${order.nftTokenId}`;

  return (
    <div>
      <div className="relative h-44 w-full bg-muted overflow-hidden">
        {image ? (
          <img src={image} alt={name} className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-destructive/20 via-rose-500/10 to-transparent flex items-center justify-center text-4xl font-bold text-muted-foreground/30">
            #{order.nftTokenId}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
      </div>
      <div className="flex items-end justify-between px-6 pt-3 pb-1">
        <div className="min-w-0">
          <p className="font-bold text-lg leading-tight truncate">{name}</p>
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

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-[calc(100%-6px)] sm:max-w-md p-0 overflow-hidden gap-0 rounded-2xl">

        {/* ── Success ── */}
        {isSuccess ? (
          <div className="flex flex-col items-center gap-5 p-6 py-8">
            <div className="h-16 w-16 rounded-full bg-emerald-500/15 flex items-center justify-center">
              <CheckCircle2 className="h-9 w-9 text-emerald-500" />
            </div>
            {order?.token?.image && (
              <div className="h-24 w-24 rounded-2xl overflow-hidden border border-border shadow-md">
                <img
                  src={ipfsToHttp(order.token.image)}
                  alt={order.token?.name || `Token #${order?.nftTokenId}`}
                  className="h-full w-full object-cover"
                />
              </div>
            )}
            <div className="text-center space-y-1">
              <p className="font-bold text-xl capitalize">{resolvedVariant} cancelled</p>
              <p className="text-sm text-muted-foreground">
                Your {resolvedVariant} for{" "}
                <span className="font-medium text-foreground">
                  {order?.token?.name || `Token #${order?.nftTokenId}`}
                </span>{" "}
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
              <TokenHero order={order} variant={resolvedVariant} />
              <div className="px-6 pb-6 pt-4 space-y-4">
                <p className="text-sm text-muted-foreground">
                  Enter your PIN to cancel this {resolvedVariant}. This action cannot be undone.
                </p>
                <PinInput
                  value={pin}
                  onChange={(v) => { setPin(v); setPinError(null); }}
                  error={pinError}
                  autoFocus
                />
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <div className="flex gap-2 pt-1">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => onOpenChange(false)}
                  >
                    <X className="h-4 w-4 mr-1.5" />
                    Keep it
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1 h-11"
                    disabled={pin.length < 6}
                    onClick={handlePin}
                  >
                    Cancel {resolvedVariant}
                  </Button>
                </div>
                {passkeySupported && (
                  <Button
                    variant="outline"
                    className="w-full text-xs"
                    disabled={isAuthenticatingPasskey}
                    onClick={handleUsePasskey}
                  >
                    {isAuthenticatingPasskey ? "Authenticating…" : "Use passkey instead"}
                  </Button>
                )}
                <p className="text-[10px] text-center text-muted-foreground">
                  Transaction gas fees are sponsored by Medialane.
                </p>
              </div>
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
