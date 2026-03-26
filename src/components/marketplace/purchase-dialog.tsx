"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { toast } from "sonner";
import { CheckCircle2, AlertCircle, ExternalLink, ShoppingCart, RefreshCw, ArrowLeft, Sparkles } from "lucide-react";
import { fireConfetti } from "@/lib/confetti";
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
import { formatDisplayPrice, ipfsToHttp } from "@/lib/utils";
import { CurrencyIcon } from "@/components/shared/currency-icon";
import { isWebAuthnSupported } from "@chipi-stack/nextjs";
import { usePasskeyAuth } from "@chipi-stack/chipi-passkey/hooks";
import { orderPriceToUsdcNumber } from "@/lib/chipi/session-preferences";

interface PurchaseDialogProps {
  order: ApiOrder;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function PurchaseDialog({ order, open, onOpenChange, onSuccess }: PurchaseDialogProps) {
  const router = useRouter();
  const { isSignedIn } = useAuth();
  const confettiFired = useRef(false);
  const {
    fulfillOrder,
    hasWallet,
    hasActiveSession,
    isSettingUpSession,
    setupSession,
    maybeClearSessionForAmountCap,
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

  const [passkeySupported] = useState(
    () => typeof window !== "undefined" && isWebAuthnSupported()
  );
  const [isAuthenticatingPasskey, setIsAuthenticatingPasskey] = useState(false);
  const { authenticate, encryptKey } = usePasskeyAuth();

  const handleBuyClick = async () => {
    if (!isSignedIn) return;
    if (!hasWallet) {
      setWalletSetupOpen(true);
      return;
    }
    const priceUsdc = orderPriceToUsdcNumber(order);
    const cleared = await maybeClearSessionForAmountCap(priceUsdc);
    if (cleared) {
      toast.info("Large purchase — fresh signing session", {
        description:
          "Your saved session was cleared for this transaction size. Register a new session to continue.",
      });
    }
    if (cleared || !hasActiveSession) {
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

  const handleUsePasskey = async () => {
    setPinError(null);
    setIsAuthenticatingPasskey(true);
    try {
      const derived = encryptKey ?? (await authenticate());
      if (!derived) throw new Error("Passkey authentication failed.");

      await fulfillOrder({
        orderHash: order.orderHash,
        pin: derived,
      });

      setPin("");
      setStep("details");
    } catch (err: unknown) {
      const msg = err instanceof Error
        ? err.message
        : "Passkey authentication failed";
      toast.error("Passkey authentication failed", { description: msg });
    } finally {
      setIsAuthenticatingPasskey(false);
    }
  };

  const handleClose = (v: boolean) => {
    if (!isProcessing) onOpenChange(v);
  };

  // Reset to fresh details state each time the dialog opens.
  // Resetting on close causes the dialog to flash to form state mid-animation;
  // resetting on open guarantees a clean slate without touching closing content.
  useEffect(() => {
    if (open) {
      resetState();
      setPin("");
      setPinError(null);
      setStep("details");
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const isSuccess = !isProcessing && txStatus === "confirmed" && !error;

  useEffect(() => {
    if (isSuccess && !confettiFired.current) {
      confettiFired.current = true;
      fireConfetti();
    }
    if (!isSuccess) confettiFired.current = false;
  }, [isSuccess]);

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
            <div className="flex flex-col items-center gap-5 py-2">
              <div className="relative">
                <div className="h-16 w-16 rounded-full bg-emerald-500/15 flex items-center justify-center">
                  <CheckCircle2 className="h-9 w-9 text-emerald-500" />
                </div>
                <Sparkles className="absolute -top-1 -right-1 h-5 w-5 text-yellow-400" />
              </div>
              {order.token?.image && (
                <div className="h-28 w-28 rounded-xl overflow-hidden border border-border shadow-md">
                  <img
                    src={ipfsToHttp(order.token.image)}
                    alt={order.token?.name || `Token #${order.nftTokenId}`}
                    className="h-full w-full object-cover"
                  />
                </div>
              )}
              <div className="text-center space-y-1">
                <p className="font-bold text-xl">You own it!</p>
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">
                    {order.token?.name || `Token #${order.nftTokenId}`}
                  </span>{" "}
                  is now in your portfolio.
                </p>
              </div>
              {txHash && (
                <a
                  href={`${EXPLORER_URL}/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <span className="font-mono">{txHash.slice(0, 10)}…{txHash.slice(-8)}</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
              <div className="flex flex-col sm:flex-row gap-2 w-full pt-1">
                <Button variant="outline" className="flex-1" onClick={() => { onOpenChange(false); onSuccess?.(); }}>
                  Close
                </Button>
                <Button className="flex-1" onClick={() => { onOpenChange(false); router.push("/portfolio/assets"); }}>
                  View portfolio
                </Button>
              </div>
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
                  <span className="font-bold inline-flex items-center gap-1">
                    <CurrencyIcon symbol={order.price.currency} size={13} />
                    {formatDisplayPrice(order.price.formatted)} {order.price.currency}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Gas</span>
                  <span className="text-emerald-500 font-medium">Free (sponsored)</span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Enter your wallet PIN to confirm this purchase, or use passkey instead.
              </p>
              <PinInput
                value={pin}
                onChange={(v) => { setPin(v); setPinError(null); }}
                error={pinError}
                autoFocus
              />
              {passkeySupported && (
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  disabled={isAuthenticatingPasskey || isProcessing}
                  onClick={handleUsePasskey}
                >
                  {isAuthenticatingPasskey ? "Authenticating passkey…" : "Use passkey instead"}
                </Button>
              )}
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
                  <span className="font-bold inline-flex items-center gap-1">
                    <CurrencyIcon symbol={order.price.currency} size={13} />
                    {formatDisplayPrice(order.price.formatted)} {order.price.currency}
                  </span>
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
