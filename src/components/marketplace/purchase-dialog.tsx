"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { toast } from "sonner";
import {
  CheckCircle2, AlertCircle, ExternalLink, Loader2,
  ShoppingCart, RefreshCw, ArrowLeft, Sparkles, Zap, Minus, Plus,
} from "lucide-react";
import { fireConfetti } from "@/lib/confetti";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PinInput, validatePin } from "@/components/ui/pin-input";
import { WalletSetupDialog } from "@/components/chipi/wallet-setup-dialog";
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
      <div className="relative h-48 w-full bg-muted overflow-hidden">
        {image ? (
          <img src={image} alt={name} className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-primary/20 via-purple-500/10 to-transparent flex items-center justify-center text-4xl font-bold text-muted-foreground/30">
            #{order.nftTokenId}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
      </div>

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
  const [quantity, setQuantity] = useState(1);

  const is1155 = order.offer?.itemType === "ERC1155";
  // Use remainingAmount if known (set after first partial fill); fall back to offerStartAmount for fresh listings
  const maxQty = is1155
    ? Math.max(1, parseInt(order.remainingAmount ?? order.offerStartAmount ?? "1", 10))
    : 1;

  const [passkeySupported] = useState(
    () => typeof window !== "undefined" && isWebAuthnSupported()
  );
  const [isAuthenticatingPasskey, setIsAuthenticatingPasskey] = useState(false);
  const [isActivatingSession, setIsActivatingSession] = useState(false);
  const { authenticate, encryptKey } = usePasskeyAuth();

  const handleBuyClick = async () => {
    if (!isSignedIn) return;
    if (!hasWallet) { setWalletSetupOpen(true); return; }
    const priceUsdc = orderPriceToUsdcNumber(order);
    const cleared = await maybeClearSessionForAmountCap(priceUsdc);
    if (cleared) {
      toast.info("Large purchase — fresh signing session", {
        description: "Your saved session was cleared for this transaction size. A new session will be activated automatically.",
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

    const qty = is1155 ? String(quantity) : undefined;
    await fulfillOrder({ orderHash: order.orderHash, pin, tokenStandard: order.offer.itemType, quantity: qty });
    setPin("");
    setStep("details");
  };

  const handleUsePasskey = async () => {
    setPinError(null);
    setIsAuthenticatingPasskey(true);
    try {
      const derived = encryptKey ?? (await authenticate());
      if (!derived) throw new Error("Passkey authentication failed.");
      if (!hasActiveSession) await setupSession(derived);
      const qty = is1155 ? String(quantity) : undefined;
      await fulfillOrder({ orderHash: order.orderHash, pin: derived, tokenStandard: order.offer.itemType, quantity: qty });
      setPin("");
      setStep("details");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Passkey authentication failed";
      toast.error("Passkey authentication failed", { description: msg });
    } finally {
      setIsAuthenticatingPasskey(false);
    }
  };

  const handleClose = (v: boolean) => { if (!isProcessing) onOpenChange(v); };

  useEffect(() => {
    if (open) {
      resetState();
      setPin("");
      setPinError(null);
      setStep("details");
      setQuantity(1);
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const isSuccess = !isProcessing && txStatus === "confirmed" && !error;

  useEffect(() => {
    if (isSuccess && !confettiFired.current) { confettiFired.current = true; fireConfetti(); }
    if (!isSuccess) confettiFired.current = false;
  }, [isSuccess]);

  // While isProcessing and the on-chain tx has confirmed, keep showing "confirming"
  // so the user doesn't see the green checkmark while backend polling is still running.
  const displayTxStatus = isProcessing && txStatus === "confirmed" ? "confirming" : txStatus;
  const processingMessage =
    txStatus === "submitting" ? "Submitting purchase…" :
    txStatus === "confirmed"  ? "Verifying marketplace order…" :
    "Confirming on Starknet…";

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden gap-0">
          <DialogTitle className="sr-only">
            {isSuccess ? "Purchase complete" : isProcessing ? "Processing purchase" : "Buy now"}
          </DialogTitle>

          {/* ── Success ──────────────────────────────────────────────────── */}
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
            /* Processing — override "confirmed" txStatus while backend polling is running
               to prevent a premature green checkmark before the order is verified. */
            <div className="flex flex-col items-center gap-4 p-6 py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <div className="text-center space-y-1">
                <p className="text-sm font-medium">{processingMessage}</p>
                {displayTxStatus === "confirming" && txStatus === "confirmed" && txHash && (
                  <a
                    href={`${EXPLORER_URL}/tx/${txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <span className="font-mono">{txHash.slice(0, 10)}…{txHash.slice(-8)}</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
              <p className="text-xs text-muted-foreground">Please wait, do not close this window.</p>
            </div>

          ) : step === "pin" ? (
            /* ── PIN step ──────────────────────────────────────────────── */
            <div className="space-y-4">
              <TokenHero order={order} />
              <div className="px-6 pb-6 space-y-4">
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
                {passkeySupported && (
                  <Button
                    variant="outline"
                    className="w-full text-xs"
                    disabled={isAuthenticatingPasskey}
                    onClick={handleUsePasskey}
                  >
                    {isAuthenticatingPasskey
                      ? <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />Authenticating…</>
                      : "Use passkey instead"}
                  </Button>
                )}
                <p className="text-[10px] text-center text-muted-foreground">
                  Transaction gas fees are sponsored by Medialane.
                </p>
              </div>
            </div>

          ) : (
            /* ── Details step ──────────────────────────────────────────── */
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
                        <a
                          href={`${EXPLORER_URL}/tx/${txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2"
                        >
                          View transaction on Voyager <ExternalLink className="h-3 w-3" />
                        </a>
                      </Button>
                    )}
                  </>
                )}

                {is1155 && maxQty > 1 && (
                  <div className="flex items-center justify-between py-1">
                    <span className="text-sm text-muted-foreground">Quantity</span>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline" size="icon" className="h-7 w-7"
                        disabled={quantity <= 1}
                        onClick={() => setQuantity(q => Math.max(1, q - 1))}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center text-sm font-medium">{quantity}</span>
                      <Button
                        variant="outline" size="icon" className="h-7 w-7"
                        disabled={quantity >= maxQty}
                        onClick={() => setQuantity(q => Math.min(maxQty, q + 1))}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                      <span className="text-xs text-muted-foreground ml-1">/ {maxQty}</span>
                    </div>
                  </div>
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
                  Atomic transactions onchain. Gas fees are sponsored by Medialane.
                </p>
              </div>
            </div>
          )}

        </DialogContent>
      </Dialog>

      <WalletSetupDialog
        open={walletSetupOpen}
        onOpenChange={setWalletSetupOpen}
        onSuccess={() => { setWalletSetupOpen(false); setStep("pin"); }}
      />
    </>
  );
}
