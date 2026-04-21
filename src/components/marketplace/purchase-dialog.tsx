"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { toast } from "sonner";
import {
  AlertCircle, ExternalLink, Loader2,
  ShoppingCart, RefreshCw, ArrowLeft, Sparkles, Zap, Minus, Plus,
  CheckCircle2, Star, Trophy, Package,
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

type Step = "details" | "pin" | "processing" | "success";

// ── Token hero — full-bleed image + name/price ───────────────────────────────
function TokenHero({ order, quantity }: { order: ApiOrder; quantity: number }) {
  const image = order.token?.image ? ipfsToHttp(order.token.image) : null;
  const name = order.token?.name || `Token #${order.nftTokenId}`;

  const unitPrice = order.price?.formatted ? parseFloat(order.price.formatted) : null;
  const totalPrice = unitPrice !== null ? unitPrice * quantity : null;
  const showTotal = quantity > 1 && totalPrice !== null;

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
              {showTotal
                ? formatDisplayPrice(totalPrice!.toFixed(order.price.decimals <= 6 ? 2 : 4))
                : formatDisplayPrice(order.price.formatted)}
            </p>
            {showTotal ? (
              <p className="text-xs text-muted-foreground">
                {formatDisplayPrice(order.price.formatted)} × {quantity} {order.price.currency}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">{order.price.currency}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Success screen ────────────────────────────────────────────────────────────
function SuccessScreen({
  order,
  quantity,
  txHash,
  onClose,
  onViewPortfolio,
}: {
  order: ApiOrder;
  quantity: number;
  txHash: string | null;
  onClose: () => void;
  onViewPortfolio: () => void;
}) {
  const image = order.token?.image ? ipfsToHttp(order.token.image) : null;
  const name = order.token?.name || `Token #${order.nftTokenId}`;
  const is1155 = order.offer?.itemType === "ERC1155";

  const unitPrice = order.price?.formatted ? parseFloat(order.price.formatted) : null;
  const totalPrice = unitPrice !== null ? unitPrice * quantity : null;

  return (
    <div className="flex flex-col items-center text-center">
      {/* Hero banner with blurred image background */}
      <div className="relative w-full h-36 overflow-hidden bg-gradient-to-br from-emerald-950 via-emerald-900/80 to-teal-900/60">
        {image && (
          <img
            src={image}
            alt=""
            className="absolute inset-0 w-full h-full object-cover opacity-20 blur-lg scale-110"
          />
        )}
        {/* Floating sparkles */}
        <div className="absolute top-3 left-6 text-yellow-400/60">
          <Star className="h-4 w-4 fill-current animate-pulse" />
        </div>
        <div className="absolute top-5 right-8 text-emerald-400/60">
          <Sparkles className="h-5 w-5 animate-pulse" style={{ animationDelay: "0.3s" }} />
        </div>
        <div className="absolute bottom-4 left-12 text-teal-400/50">
          <Star className="h-3 w-3 fill-current animate-pulse" style={{ animationDelay: "0.6s" }} />
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <Trophy className="h-12 w-12 text-emerald-400/80" />
        </div>
      </div>

      {/* Token image floating over the banner */}
      <div className="relative -mt-14 mb-3">
        <div className="h-28 w-28 rounded-2xl overflow-hidden border-4 border-background shadow-2xl ring-2 ring-emerald-500/40">
          {image ? (
            <img src={image} alt={name} className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-primary/30 to-purple-500/20 flex items-center justify-center text-2xl font-bold text-muted-foreground/50">
              #{order.nftTokenId}
            </div>
          )}
        </div>
        <div className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg border-2 border-background">
          <CheckCircle2 className="h-4 w-4 text-white" />
        </div>
      </div>

      {/* Headline */}
      <div className="px-6 space-y-1 mb-4">
        <h2 className="text-2xl font-extrabold tracking-tight">
          {is1155 && quantity > 1 ? `You own ${quantity}×` : "You own it!"}
        </h2>
        <p className="text-base font-semibold text-foreground/80 leading-snug">{name}</p>
        <p className="text-sm text-muted-foreground">
          {is1155 && quantity > 1
            ? `${quantity} editions are now in your portfolio`
            : "This IP asset is now in your portfolio"}
        </p>
      </div>

      {/* Purchase summary card */}
      <div className="mx-6 w-[calc(100%-3rem)] rounded-xl border border-emerald-500/20 bg-emerald-500/5 divide-y divide-emerald-500/10 mb-4 text-sm">
        {order.price && (
          <div className="flex items-center justify-between px-4 py-2.5">
            <span className="text-muted-foreground">Price paid</span>
            <span className="font-semibold flex items-center gap-1.5">
              <CurrencyIcon symbol={order.price.currency} size={13} />
              {totalPrice !== null && quantity > 1
                ? `${formatDisplayPrice(totalPrice.toFixed(order.price.decimals <= 6 ? 2 : 4))} ${order.price.currency}`
                : `${formatDisplayPrice(order.price.formatted)} ${order.price.currency}`}
            </span>
          </div>
        )}
        <div className="flex items-center justify-between px-4 py-2.5">
          <span className="text-muted-foreground">Network</span>
          <span className="font-medium flex items-center gap-1.5">
            <Zap className="h-3.5 w-3.5 text-emerald-500" />
            Starknet · Gasless
          </span>
        </div>
        {txHash && (
          <div className="flex items-center justify-between px-4 py-2.5">
            <span className="text-muted-foreground">Transaction</span>
            <a
              href={`${EXPLORER_URL}/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 font-mono text-xs text-primary hover:text-primary/80 transition-colors group"
            >
              {txHash.slice(0, 8)}…{txHash.slice(-6)}
              <ExternalLink className="h-3 w-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </a>
          </div>
        )}
        <div className="flex items-center justify-between px-4 py-2.5">
          <span className="text-muted-foreground">Ownership</span>
          <span className="font-medium text-emerald-400 flex items-center gap-1">
            <Package className="h-3.5 w-3.5" />
            Immutable on-chain
          </span>
        </div>
      </div>

      {/* CTAs */}
      <div className="px-6 pb-6 w-full flex flex-col gap-2">
        <Button className="w-full h-11 text-sm font-semibold" onClick={onViewPortfolio}>
          View in portfolio
        </Button>
        <Button variant="ghost" className="w-full h-9 text-sm text-muted-foreground" onClick={onClose}>
          Continue browsing
        </Button>
      </div>
    </div>
  );
}

export function PurchaseDialog({ order, open, onOpenChange, onSuccess }: PurchaseDialogProps) {
  const router = useRouter();
  const { isSignedIn } = useAuth();
  const {
    fulfillOrder,
    hasWallet,
    hasActiveSession,
    setupSession,
    maybeClearSessionForAmountCap,
    isProcessing,
    txHash,
    error,
    resetState,
  } = useMarketplace();

  const [walletSetupOpen, setWalletSetupOpen] = useState(false);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState<string | null>(null);
  const [step, setStep] = useState<Step>("details");
  const [quantity, setQuantity] = useState(1);
  const [successTxHash, setSuccessTxHash] = useState<string | null>(null);

  const is1155 = order.offer?.itemType === "ERC1155";
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
        description: "Your saved session was cleared for this transaction size.",
      });
    }
    setStep("pin");
  };

  const handlePurchaseSuccess = (hash: string | null) => {
    setSuccessTxHash(hash ?? null);
    setStep("success");
    fireConfetti();
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

    setStep("processing");
    const qty = is1155 ? String(quantity) : undefined;
    const hash = await fulfillOrder({
      orderHash: order.orderHash,
      pin,
      tokenStandard: order.offer.itemType,
      quantity: qty,
    });
    setPin("");

    if (hash) {
      handlePurchaseSuccess(hash);
    } else {
      // error is set in useMarketplace; go back to details to show it
      setStep("details");
    }
  };

  const handleUsePasskey = async () => {
    setPinError(null);
    setIsAuthenticatingPasskey(true);
    try {
      const derived = encryptKey ?? (await authenticate());
      if (!derived) throw new Error("Passkey authentication failed.");
      if (!hasActiveSession) await setupSession(derived);
      setStep("processing");
      const qty = is1155 ? String(quantity) : undefined;
      const hash = await fulfillOrder({
        orderHash: order.orderHash,
        pin: derived,
        tokenStandard: order.offer.itemType,
        quantity: qty,
      });
      setPin("");

      if (hash) {
        handlePurchaseSuccess(hash);
      } else {
        setStep("details");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Passkey authentication failed";
      toast.error("Passkey authentication failed", { description: msg });
      setStep("details");
    } finally {
      setIsAuthenticatingPasskey(false);
    }
  };

  const handleClose = (v: boolean) => {
    if (step === "processing") return; // block close during tx
    onOpenChange(v);
  };

  useEffect(() => {
    if (open) {
      resetState();
      setPin("");
      setPinError(null);
      setStep("details");
      setQuantity(1);
      setSuccessTxHash(null);
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const processingMessage =
    isProcessing
      ? "Verifying marketplace order…"
      : "Confirming on Starknet…";

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden gap-0">
          <DialogTitle className="sr-only">
            {step === "success" ? "Purchase complete" : step === "processing" ? "Processing purchase" : "Buy now"}
          </DialogTitle>

          {/* ── Success ──────────────────────────────────────────────────── */}
          {step === "success" ? (
            <SuccessScreen
              order={order}
              quantity={quantity}
              txHash={successTxHash ?? txHash}
              onClose={() => { onOpenChange(false); onSuccess?.(); }}
              onViewPortfolio={() => { onOpenChange(false); router.push("/portfolio/assets"); }}
            />

          ) : step === "processing" || isActivatingSession ? (
            /* Processing / activating session */
            <div className="flex flex-col items-center gap-4 p-6 py-10">
              <div className="relative">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
              </div>
              <div className="text-center space-y-1">
                <p className="text-sm font-medium">
                  {isActivatingSession ? "Activating wallet session…" : processingMessage}
                </p>
                {txHash && step === "processing" && (
                  <a
                    href={`${EXPLORER_URL}/tx/${txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors mt-1"
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
              <TokenHero order={order} quantity={quantity} />
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
              <TokenHero order={order} quantity={quantity} />
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
