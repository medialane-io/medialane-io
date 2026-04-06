"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { toast } from "sonner";
import { CheckCircle2, AlertCircle, ExternalLink, Loader2, ShoppingCart, RefreshCw, ArrowLeft, Sparkles, Zap } from "lucide-react";
import { fireConfetti } from "@/lib/confetti";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PinInput, validatePin } from "@/components/ui/pin-input";
import { WalletSetupDialog } from "@/components/chipi/wallet-setup-dialog";
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

// ── Token hero — full-bleed image + name/price ───────────────────────────────
function TokenHero({ order }: { order: ApiOrder }) {
  const image = order.token?.image ? ipfsToHttp(order.token.image) : null;
  const name = order.token?.name || `Token #${order.nftTokenId}`;

  return (
    <div>
      {/* Full-bleed image */}
      <div className="relative h-48 w-full bg-muted overflow-hidden">
        {image ? (
          <img src={image} alt={name} className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-primary/20 via-purple-500/10 to-transparent flex items-center justify-center text-4xl font-bold text-muted-foreground/30">
            #{order.nftTokenId}
          </div>
        )}
        {/* Subtle gradient fade into dialog bg */}
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
      </div>

      {/* Name + price row */}
      <div className="flex items-end justify-between px-6 pt-3 pb-1">
        <div className="min-w-0">
          <p className="font-bold text-lg leading-tight truncate">{name}</p>
          <div className="flex items-center gap-1 mt-1">
            <Zap className="h-3 w-3 text-emerald-500" />
            <span className="text-[11px] font-medium text-emerald-500">Gasless · Starknet</span>
          </div>
        </div>
        {order.price && (
          <div className="shrink-0 text-right ml-4">
            <p className="flex items-center gap-1.5 font-bold text-2xl justify-end">
              <CurrencyIcon symbol={order.price.currency} size={18} />
              {formatDisplayPrice(order.price.formatted)}
            </p>
            <p className="text-xs text-muted-foreground">{order.price.currency}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export function PurchaseDialog({ order, open, onOpenChange, onSuccess }: PurchaseDialogProps) {
  const router = useRouter();
  const { isSignedIn } = useAuth();
  const confettiFired = useRef(false);
  const {
    fulfillOrder,
    hasWallet,
    hasActiveSession,
    setupSession,
    maybeClearSessionForAmountCap,
    isProcessing,
    txStatus,
    txHash,
    error,
    resetState,
  } = useMarketplace();

  const [walletSetupOpen, setWalletSetupOpen] = useState(false);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState<string | null>(null);
  const [step, setStep] = useState<"details" | "pin">("details");

  const [passkeySupported] = useState(
    () => typeof window !== "undefined" && isWebAuthnSupported()
  );
  const [isAuthenticatingPasskey, setIsAuthenticatingPasskey] = useState(false);
  const [isActivatingSession, setIsActivatingSession] = useState(false);
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
          "Your saved session was cleared for this transaction size. A new session will be activated automatically.",
      });
    }
    setStep("pin");
  };

  const handlePin = async () => {
    const err = validatePin(pin);
    if (err) { setPinError(err); return; }
    setPinError(null);

    if (!hasActiveSession) {
      setIsActivatingSession(true);
      try {
        await setupSession(pin);
      } catch (err: unknown) {
        setPinError(err instanceof Error ? err.message : "Session setup failed. Please try again.");
        return;
      } finally {
        setIsActivatingSession(false);
      }
    }

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

      if (!hasActiveSession) {
        await setupSession(derived);
      }

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
        <DialogContent className="sm:max-w-md p-0 overflow-hidden gap-0">

          {isSuccess ? (
            <div className="flex flex-col items-center gap-5 p-6 py-8">
              <div className="relative">
                <div className="h-16 w-16 rounded-full bg-emerald-500/15 flex items-center justify-center">
                  <CheckCircle2 className="h-9 w-9 text-emerald-500" />
                </div>
                <Sparkles className="absolute -top-1 -right-1 h-5 w-5 text-yellow-400" />
              </div>
              {order.token?.image && (
                <div className="h-28 w-28 rounded-2xl overflow-hidden border border-border shadow-lg">
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

          ) : isActivatingSession ? (
            <div className="flex flex-col items-center gap-4 p-6 py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Activating wallet session…</p>
            </div>

          ) : (isProcessing || txStatus === "confirming") ? (
            <div className="p-6">
              <TxStatus status={txStatus} txHash={txHash} error={error} statusMessage={
                txStatus === "submitting" ? "Submitting purchase…" : "Confirming on Starknet…"
              } />
            </div>

          ) : step === "pin" ? (
            <div className="space-y-4">
              <TokenHero order={order} />
              <div className="px-6 space-y-4">
              <p className="text-sm text-muted-foreground">Enter your PIN to confirm this purchase.</p>
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
              <p className="text-[10px] text-center text-muted-foreground pb-2">
                Gas fees are sponsored by Medialane. Your PIN authorizes this transaction.
              </p>
              </div>
            </div>

          ) : (
            <div className="space-y-0">
              <TokenHero order={order} />

              <div className="px-6 pb-6 pt-3 space-y-3">
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
                  <p className="text-sm text-muted-foreground text-center py-2">
                    Sign in to purchase this asset.
                  </p>
                ) : (
                  <Button className="w-full h-12 text-base font-semibold" onClick={handleBuyClick}>
                    {error ? <RefreshCw className="h-4 w-4 mr-2" /> : <ShoppingCart className="h-4 w-4 mr-2" />}
                    {error ? "Try again" : hasWallet ? "Buy now" : "Secure account & buy"}
                  </Button>
                )}

                <p className="text-[10px] text-center text-muted-foreground">
                  Gas fees are sponsored by Medialane. Your PIN authorizes this transaction.
                </p>
              </div>
            </div>
          )}

        </DialogContent>
      </Dialog>

      <WalletSetupDialog
        open={walletSetupOpen}
        onOpenChange={setWalletSetupOpen}
        onSuccess={() => {
          setWalletSetupOpen(false);
          setStep("pin");
        }}
      />
    </>
  );
}
