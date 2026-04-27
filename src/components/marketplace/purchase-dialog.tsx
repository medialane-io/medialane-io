"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { toast } from "sonner";
import {
  AlertCircle, ExternalLink, Loader2,
  ShoppingCart, RefreshCw, ArrowLeft, Sparkles, Zap, Minus, Plus,
  CheckCircle2, Package,
} from "lucide-react";
import { fireConfetti } from "@/lib/confetti";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PinInput } from "@/components/ui/pin-input";
import { WalletSetupDialog } from "@/components/chipi/wallet-setup-dialog";
import { useMarketplace } from "@/hooks/use-marketplace";
import { useMarketplaceActionFlow } from "@/hooks/use-marketplace-action-flow";
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
      <div className="relative h-52 w-full bg-muted overflow-hidden shrink-0">
        {image ? (
          <img src={image} alt={name} className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-primary/20 via-purple-500/10 to-transparent flex items-center justify-center text-4xl font-bold text-muted-foreground/30">
            #{order.nftTokenId}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between px-5 pt-4 pb-1">
        <div className="min-w-0">
          <p className="font-bold text-lg leading-tight truncate">{name}</p>
          <div className="flex items-center gap-1 mt-1">
            <Zap className="h-3 w-3 text-emerald-500" />
            <span className="text-[11px] font-medium text-emerald-500">Digital Asset Ownership</span>
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
    <div className="flex flex-col items-center gap-5 p-6 py-8">
      {/* Token image + badge */}
      <div className="relative">
        {image ? (
          <div className="h-32 w-32 rounded-2xl overflow-hidden border border-border shadow-lg">
            <img src={image} alt={name} className="h-full w-full object-cover" />
          </div>
        ) : (
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
            <CheckCircle2 className="h-9 w-9 text-primary" />
          </div>
        )}
        <div className="absolute -bottom-2 -right-2 h-9 w-9 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg border-2 border-background">
          <CheckCircle2 className="h-5 w-5 text-white" />
        </div>
        <Sparkles className="absolute -top-2 -right-2 h-5 w-5 text-yellow-400" />
      </div>

      {/* Headline */}
      <div className="text-center space-y-1">
        <p className="font-bold text-xl">
          {is1155 && quantity > 1 ? `You own ${quantity}×` : "You own it!"}
        </p>
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{name}</span>{" "}
          {is1155 && quantity > 1
            ? "editions are now in your portfolio."
            : "is now in your portfolio."}
        </p>
      </div>

      {/* Summary rows */}
      <div className="w-full rounded-xl border border-border divide-y divide-border text-sm">
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
            <Zap className="h-3.5 w-3.5 text-primary" />
            Starknet · Gasless
          </span>
        </div>
        <div className="flex items-center justify-between px-4 py-2.5">
          <span className="text-muted-foreground">Ownership</span>
          <span className="font-medium flex items-center gap-1.5">
            <Package className="h-3.5 w-3.5" />
            Immutable on-chain
          </span>
        </div>
        {txHash && (
          <div className="flex items-center justify-between px-4 py-2.5">
            <span className="text-muted-foreground">Transaction</span>
            <a
              href={`${EXPLORER_URL}/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 font-mono text-xs text-primary hover:underline transition-colors"
            >
              {txHash.slice(0, 8)}…{txHash.slice(-6)}
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        )}
      </div>

      {/* CTAs */}
      <div className="flex flex-col sm:flex-row gap-2 w-full pt-1">
        <Button variant="outline" className="flex-1" onClick={onClose}>
          Close
        </Button>
        <Button className="flex-1" onClick={onViewPortfolio}>
          View portfolio
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

  const [step, setStep] = useState<Step>("details");
  const [quantity, setQuantity] = useState(1);
  const [successTxHash, setSuccessTxHash] = useState<string | null>(null);

  const is1155 = order.offer?.itemType === "ERC1155";
  const maxQty = is1155
    ? Math.max(1, parseInt(order.remainingAmount ?? order.offer.startAmount ?? "1", 10))
    : 1;

  const [passkeySupported] = useState(
    () => typeof window !== "undefined" && isWebAuthnSupported()
  );
  const { authenticate, encryptKey } = usePasskeyAuth();

  const handlePurchaseSuccess = (hash: string | null) => {
    setSuccessTxHash(hash ?? null);
    setStep("success");
    fireConfetti();
  };

  const {
    walletSetupOpen,
    setWalletSetupOpen,
    pin,
    setPin,
    pinError,
    setPinError,
    isAuthenticatingPasskey,
    isActivatingSession,
    beginAction,
    handlePin,
    handleUsePasskey,
    resetActionFlow,
  } = useMarketplaceActionFlow<{ quantity: number }>({
    isSignedIn,
    hasWallet,
    hasActiveSession,
    setupSession,
    maybeClearSessionForAmountCap,
    authenticate,
    encryptKey,
    sessionRefreshTitle: "Large purchase — fresh signing session",
    sessionRefreshDescription: "Your saved session was cleared for this transaction size.",
    executeAction: async (values, pinOrDerivedKey) => {
      setStep("processing");
      const qty = is1155 ? String(values.quantity) : undefined;
      const hash = await fulfillOrder({
        orderHash: order.orderHash,
        pin: pinOrDerivedKey,
        tokenStandard: order.offer.itemType,
        quantity: qty,
      });

      if (hash) {
        handlePurchaseSuccess(hash);
      } else {
        setStep("details");
      }
    },
  });

  const handleBuyClick = async () => {
    const priceUsdc = orderPriceToUsdcNumber(order) * quantity;
    await beginAction({ quantity }, priceUsdc);
    setStep("pin");
  };

  const handleClose = (v: boolean) => {
    if (step === "processing") return; // block close during tx
    onOpenChange(v);
  };

  useEffect(() => {
    if (open) {
      resetState();
      resetActionFlow();
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
        <DialogContent className="max-w-[calc(100%-12px)] sm:max-w-md p-0 overflow-hidden gap-0 rounded-2xl">
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
                  <div className={`btn-border-animated p-[1px] rounded-xl flex-1 ${pin.length < 6 ? "opacity-50 pointer-events-none" : ""}`}>
                    <button
                      disabled={pin.length < 6}
                      onClick={handlePin}
                      className="w-full h-11 rounded-[11px] flex items-center justify-center gap-2 text-sm font-semibold text-white transition-all hover:brightness-110 active:scale-[0.98] bg-background/30"
                    >
                      <ShoppingCart className="h-4 w-4" />
                      Buy now
                    </button>
                  </div>
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
                  <div className="btn-border-animated p-[1px] rounded-xl">
                    <button
                      className="w-full h-12 rounded-[11px] flex items-center justify-center gap-2 text-base font-semibold text-white transition-all hover:brightness-110 active:scale-[0.98] bg-background/30"
                      onClick={handleBuyClick}
                    >
                      {error ? <RefreshCw className="h-4 w-4" /> : <ShoppingCart className="h-4 w-4" />}
                      {error ? "Try again" : hasWallet ? "Buy now" : "Secure account & buy"}
                    </button>
                  </div>
                )}

                <p className="text-[10px] text-center text-muted-foreground">
                  All orders are registered onchain with immutable smart contract with atomic transactions. Gas fees are sponsored on us!
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
