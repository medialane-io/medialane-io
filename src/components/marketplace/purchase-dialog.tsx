"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { CheckCircle2, AlertCircle, ExternalLink, ShoppingCart } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PinDialog } from "@/components/chipi/pin-dialog";
import { WalletSetupDialog } from "@/components/chipi/wallet-setup-dialog";
import { SessionSetupDialog } from "@/components/chipi/session-setup-dialog";
import { TxStatus } from "@/components/chipi/tx-status";
import { useMarketplace } from "@/hooks/use-marketplace";
import { EXPLORER_URL } from "@/lib/constants";
import type { ApiOrder } from "@medialane/sdk";

interface PurchaseDialogProps {
  order: ApiOrder;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PurchaseDialog({ order, open, onOpenChange }: PurchaseDialogProps) {
  const { isSignedIn } = useAuth();
  const {
    fulfillOrder,
    hasWallet,
    hasActiveSession,
    isSettingUpSession,
    setupSession,
    isProcessing,
    txStatus,
    txHash,
    error,
    resetState,
  } = useMarketplace();

  const [pinOpen, setPinOpen] = useState(false);
  const [walletSetupOpen, setWalletSetupOpen] = useState(false);
  const [sessionSetupOpen, setSessionSetupOpen] = useState(false);

  const handleBuyClick = () => {
    if (!isSignedIn) return;
    if (!hasWallet) {
      setWalletSetupOpen(true);
      return;
    }
    if (!hasActiveSession) {
      setSessionSetupOpen(true);
      return;
    }
    setPinOpen(true);
  };

  const handleSessionSetup = async (pin: string) => {
    await setupSession(pin);
    setSessionSetupOpen(false);
    setPinOpen(true);
  };

  const handlePin = async (pin: string) => {
    setPinOpen(false);
    await fulfillOrder({
      orderHash: order.orderHash,
      considerationToken: order.consideration.token,
      considerationAmount: order.consideration.startAmount,
      nftContract: order.nftContract,
      nftTokenId: order.nftTokenId,
      pin,
    });
  };

  const handleClose = (v: boolean) => {
    if (!isProcessing) {
      resetState();
      onOpenChange(v);
    }
  };

  const isSuccess = txStatus === "confirmed";

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Purchase Token #{order.nftTokenId}</DialogTitle>
            <DialogDescription>
              Buy this IP asset gaslessly with your invisible Starknet wallet.
            </DialogDescription>
          </DialogHeader>

          {isSuccess ? (
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="h-16 w-16 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-emerald-500" />
              </div>
              <p className="font-semibold">Purchase successful!</p>
              <p className="text-sm text-muted-foreground text-center">
                Token #{order.nftTokenId} is now in your portfolio.
              </p>
              {txHash && (
                <Button variant="outline" size="sm" asChild>
                  <a href={`${EXPLORER_URL}/tx/${txHash}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                    View on Voyager <ExternalLink className="h-3 w-3" />
                  </a>
                </Button>
              )}
              <Button className="w-full" onClick={() => onOpenChange(false)}>Done</Button>
            </div>
          ) : (isProcessing || txStatus === "confirming") ? (
            <TxStatus status={txStatus} txHash={txHash} error={error} statusMessage={
              txStatus === "submitting" ? "Submitting purchase…" : "Confirming on Starknet…"
            } />
          ) : (
            <div className="space-y-4 py-2">
              {/* Order summary */}
              <div className="rounded-lg bg-muted/30 p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Token</span>
                  <span className="font-mono">#{order.nftTokenId}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Price</span>
                  <span className="font-bold">{order.price.formatted} {order.price.currency}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Gas</span>
                  <span className="text-emerald-500 font-medium">Free (sponsored)</span>
                </div>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {!isSignedIn ? (
                <p className="text-sm text-muted-foreground text-center">
                  Sign in to purchase this asset.
                </p>
              ) : (
                <Button className="w-full h-11" onClick={handleBuyClick}>
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  {hasWallet ? "Buy now" : "Set up wallet & buy"}
                </Button>
              )}

              <p className="text-[10px] text-center text-muted-foreground">
                Gas fees are sponsored by Medialane. Your PIN authorizes this transaction.
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <PinDialog
        open={pinOpen}
        onSubmit={handlePin}
        onCancel={() => setPinOpen(false)}
        title="Confirm purchase"
        description={`Enter your PIN to buy token #${order.nftTokenId} for ${order.price.formatted} ${order.price.currency}.`}
      />

      <SessionSetupDialog
        open={sessionSetupOpen}
        onOpenChange={setSessionSetupOpen}
        onSetup={handleSessionSetup}
        isProcessing={isSettingUpSession}
      />

      <WalletSetupDialog
        open={walletSetupOpen}
        onOpenChange={setWalletSetupOpen}
        onSuccess={() => {
          setWalletSetupOpen(false);
          if (!hasActiveSession) {
            setSessionSetupOpen(true);
          } else {
            setPinOpen(true);
          }
        }}
      />
    </>
  );
}
