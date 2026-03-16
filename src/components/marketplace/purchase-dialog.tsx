"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { toast } from "sonner";
import { CheckCircle2, AlertCircle, ExternalLink, ShoppingCart, RefreshCw, ArrowLeft } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PinInput, validatePin } from "@/components/ui/pin-input";
import { WalletSetupDialog } from "@/components/chipi/wallet-setup-dialog";
import { SessionSetupDialog } from "@/components/chipi/session-setup-dialog";
import { TxStatus } from "@/components/chipi/tx-status";
import { useMarketplace } from "@/hooks/use-marketplace";
import { EXPLORER_URL } from "@/lib/constants";
import type { ApiOrder } from "@medialane/sdk";
import { formatDisplayPrice } from "@/lib/utils";

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

  const [walletSetupOpen, setWalletSetupOpen] = useState(false);
  const [sessionSetupOpen, setSessionSetupOpen] = useState(false);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState<string | null>(null);
  const [step, setStep] = useState<"details" | "pin">("details");

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
    setStep("pin");
  };

  const handleSessionSetup = async (pin: string) => {
    try {
      await setupSession(pin);
      setSessionSetupOpen(false);
      setStep("pin");
    } catch {
      toast.error("Session setup failed. Please try again.");
    }
  };

  const handlePin = async () => {
    const err = validatePin(pin);
    if (err) { setPinError(err); return; }
    setPinError(null);

    await fulfillOrder({
      orderHash: order.orderHash,
      pin,
    });
    setPin("");
    setStep("details");
  };

  const handleClose = (v: boolean) => {
    if (!isProcessing) {
      resetState();
      setPin("");
      setPinError(null);
      setStep("details");
      onOpenChange(v);
    }
  };

  const isSuccess = txStatus === "confirmed" && !error;

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {step === "pin" ? "Confirm with PIN" : `Purchase Token #${order.nftTokenId}`}
            </DialogTitle>
            {step === "details" && (
              <DialogDescription>
                Buy this IP asset gaslessly with your invisible Starknet wallet.
              </DialogDescription>
            )}
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
              <Button className="w-full" onClick={() => { resetState(); setStep("details"); onOpenChange(false); }}>Done</Button>
            </div>
          ) : (isProcessing || txStatus === "confirming") ? (
            <TxStatus status={txStatus} txHash={txHash} error={error} statusMessage={
              txStatus === "submitting" ? "Submitting purchase…" : "Confirming on Starknet…"
            } />
          ) : step === "pin" ? (
            <div className="space-y-4 py-2">
              <div className="rounded-lg bg-muted/30 p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Token</span>
                  <span className="font-mono">#{order.nftTokenId}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Price</span>
                  <span className="font-bold">{formatDisplayPrice(order.price.formatted)} {order.price.currency}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Gas</span>
                  <span className="text-emerald-500 font-medium">Free (sponsored)</span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Enter your wallet PIN to confirm this purchase.
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
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="gap-1.5"
                  onClick={() => { setStep("details"); setPin(""); setPinError(null); }}
                >
                  <ArrowLeft className="h-4 w-4" /> Back
                </Button>
                <Button
                  className="flex-1 h-11"
                  disabled={pin.length < 6}
                  onClick={handlePin}
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Buy now
                </Button>
              </div>
              <p className="text-[10px] text-center text-muted-foreground">
                Gas fees are sponsored by Medialane. Your PIN authorizes this transaction.
              </p>
            </div>
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
                  <span className="font-bold">{formatDisplayPrice(order.price.formatted)} {order.price.currency}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Gas</span>
                  <span className="text-emerald-500 font-medium">Free (sponsored)</span>
                </div>
              </div>

              {error && (
                <>
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                  {txHash && (
                    <Button variant="outline" size="sm" className="w-full" asChild>
                      <a href={`${EXPLORER_URL}/tx/${txHash}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                        View transaction on Voyager <ExternalLink className="h-3 w-3" />
                      </a>
                    </Button>
                  )}
                </>
              )}

              {!isSignedIn ? (
                <p className="text-sm text-muted-foreground text-center">
                  Sign in to purchase this asset.
                </p>
              ) : (
                <Button className="w-full h-11" onClick={handleBuyClick}>
                  {error ? <RefreshCw className="h-4 w-4 mr-2" /> : <ShoppingCart className="h-4 w-4 mr-2" />}
                  {error ? "Try again" : hasWallet ? "Buy now" : "Set up wallet & buy"}
                </Button>
              )}

              <p className="text-[10px] text-center text-muted-foreground">
                Gas fees are sponsored by Medialane. Your PIN authorizes this transaction.
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>

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
            setStep("pin");
          }
        }}
      />
    </>
  );
}
