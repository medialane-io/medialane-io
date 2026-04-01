"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { toast } from "sonner";
import { CheckCircle2, AlertCircle, ExternalLink, ShoppingCart, RefreshCw, ArrowLeft, Sparkles, Zap } from "lucide-react";
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

// ── Shared order summary row ──────────────────────────────────────────────────
function SummaryRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span>{children}</span>
    </div>
  );
}

// ── Token hero (image + name shown at top of dialog) ─────────────────────────
function TokenHero({ order }: { order: ApiOrder }) {
  const image = order.token?.image ? ipfsToHttp(order.token.image) : null;
  const name = order.token?.name || `Token #${order.nftTokenId}`;

  return (
    <div className="flex items-center gap-4 pb-4 border-b border-border/50">
      <div className="relative h-16 w-16 shrink-0 rounded-xl overflow-hidden bg-muted border border-border/60 shadow-md">
        {image ? (
          <img src={image} alt={name} className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center text-lg font-bold text-muted-foreground">
            #{order.nftTokenId}
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-base leading-tight truncate">{name}</p>
        <p className="text-xs text-muted-foreground mt-0.5 font-mono">
          Token #{order.nftTokenId}
        </p>
        <div className="flex items-center gap-1 mt-1.5">
          <Zap className="h-3 w-3 text-emerald-500" />
          <span className="text-[11px] font-medium text-emerald-500">Gasless purchase</span>
        </div>
      </div>
      {order.price && (
        <div className="shrink-0 text-right">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Price</p>
          <p className="flex items-center gap-1 font-bold text-xl mt-0.5 justify-end">
            <CurrencyIcon symbol={order.price.currency} size={16} />
            {formatDisplayPrice(order.price.formatted)}
          </p>
          <p className="text-xs text-muted-foreground">{order.price.currency}</p>
        </div>
      )}
    </div>
  );
}

// ── Order summary card ────────────────────────────────────────────────────────
function OrderSummary({ order }: { order: ApiOrder }) {
  return (
    <div className="rounded-xl bg-muted/30 border border-border/40 p-4 space-y-2.5">
      <SummaryRow label="Token">
        <span className="font-mono text-foreground">#{order.nftTokenId}</span>
      </SummaryRow>
      <SummaryRow label="Price">
        <span className="font-bold inline-flex items-center gap-1 text-foreground">
          <CurrencyIcon symbol={order.price.currency} size={13} />
          {formatDisplayPrice(order.price.formatted)} {order.price.currency}
        </span>
      </SummaryRow>
      <div className="border-t border-border/40 pt-2.5">
        <SummaryRow label="Gas fee">
          <span className="inline-flex items-center gap-1 text-emerald-500 font-medium">
            <Zap className="h-3 w-3" />
            Free (sponsored)
          </span>
        </SummaryRow>
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

          ) : (isProcessing || txStatus === "confirming") ? (
            <div className="p-6">
              <TxStatus status={txStatus} txHash={txHash} error={error} statusMessage={
                txStatus === "submitting" ? "Submitting purchase…" : "Confirming on Starknet…"
              } />
            </div>

          ) : step === "pin" ? (
            <div className="p-6 space-y-4">
              <DialogHeader className="pb-0">
                <DialogTitle>Confirm purchase</DialogTitle>
                <DialogDescription>Enter your PIN to complete this transaction.</DialogDescription>
              </DialogHeader>
              <TokenHero order={order} />
              <OrderSummary order={order} />
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
              <p className="text-[10px] text-center text-muted-foreground">
                Gas fees are sponsored by Medialane. Your PIN authorizes this transaction.
              </p>
            </div>

          ) : (
            <div className="p-6 space-y-4">
              <DialogHeader className="pb-0">
                <DialogTitle>Purchase IP Asset</DialogTitle>
                <DialogDescription>Buy gaslessly with your invisible Starknet wallet.</DialogDescription>
              </DialogHeader>

              <TokenHero order={order} />
              <OrderSummary order={order} />

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
