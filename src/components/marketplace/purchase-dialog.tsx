"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  AlertCircle, ExternalLink, Loader2,
  ShoppingCart, RefreshCw, Zap, Minus, Plus,
  CheckCircle2, ShieldCheck,
} from "lucide-react";
import { fireConfetti } from "@/lib/confetti";
import { rewardToast } from "@/lib/reward-toast";
import { assetHref as buildAssetHref } from "@/lib/routes";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useMarketplace } from "@/hooks/use-marketplace";
import { useWalletMarketplaceActionFlow } from "@/hooks/use-wallet-marketplace-action-flow";
import {
  MarketplaceErrorState,
  MarketplaceTxLink,
} from "@/components/marketplace/marketplace-dialog-primitives";
import { EXPLORER_URL } from "@/lib/constants";
import type { ApiOrder } from "@medialane/sdk";
import { formatDisplayPrice, ipfsToHttp } from "@/lib/utils";
import { CurrencyIcon } from "@/components/shared/currency-icon";
import { useUsdPrices } from "@/hooks/use-usd-prices";
import { usdValueFor } from "@/lib/wallet-format";
import { isStableCurrency } from "@medialane/ui";
import { useErc20Balance } from "@/hooks/use-erc20-balance";
import { getTokenBySymbol } from "@medialane/sdk";
import { buildSwapCalls } from "@/lib/wallet/swap-calls";
import { PayWithPicker } from "@/components/marketplace/pay-with-picker";

interface PurchaseDialogProps {
  order: ApiOrder;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

type Step = "details" | "processing" | "success";

function TokenHero({ order, quantity }: { order: ApiOrder; quantity: number }) {
  const image = order.token?.image ? ipfsToHttp(order.token.image) : null;
  const name = order.token?.name || `Token #${order.nftTokenId}`;
  const usdPrices = useUsdPrices();

  const unitPrice = order.price?.formatted ? parseFloat(order.price.formatted) : null;
  const totalPrice = unitPrice !== null ? unitPrice * quantity : null;
  const showTotal = quantity > 1 && totalPrice !== null;
  const totalUsd = totalPrice !== null
    ? usdValueFor(String(totalPrice), order.price?.currency, usdPrices)
    : null;

  return (
    <div>
      <div className="relative h-32 w-full bg-muted overflow-hidden shrink-0">
        {image ? (
          <Image src={image} alt={name} fill className="object-cover" />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-primary/20 via-brand-purple/10 to-transparent flex items-center justify-center text-4xl font-bold text-muted-foreground/30">
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
        {order.price && (() => {
          const totalCryptoDisplay = showTotal
            ? formatDisplayPrice(totalPrice!.toFixed(order.price.decimals <= 6 ? 2 : 4))
            : formatDisplayPrice(order.price.formatted);
          const stable = isStableCurrency(order.price.currency);
          const displayFace = "font-[family-name:var(--font-display)] font-extrabold tracking-tight tabular-nums";

          return (
            <div className="shrink-0 text-right ml-4">
              {totalUsd ? (
                <p className={`${displayFace} text-2xl`}>{totalUsd}</p>
              ) : (
                <p className={`flex items-center gap-2 justify-end ${displayFace} text-2xl`}>
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-foreground/[0.06]">
                    <CurrencyIcon symbol={order.price.currency} size={13} />
                  </span>
                  {totalCryptoDisplay}
                </p>
              )}
              <p className="text-sm font-semibold text-muted-foreground inline-flex items-center gap-1.5 justify-end mt-0.5">
                {totalUsd && (
                  <span className="grid h-4 w-4 shrink-0 place-items-center rounded-full bg-foreground/[0.06]">
                    <CurrencyIcon symbol={order.price.currency} size={10} />
                  </span>
                )}
                {totalUsd
                  ? (stable ? order.price.currency : `${totalCryptoDisplay} ${order.price.currency}`)
                  : order.price.currency}
              </p>
              {showTotal && (
                <p className="text-2xs text-muted-foreground/60 mt-0.5">
                  {formatDisplayPrice(order.price.formatted)} × {quantity} {order.price.currency}
                </p>
              )}
            </div>
          );
        })()}
      </div>
    </div>
  );
}

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
  const name = order.token?.name ?? null;
  const is1155 = order.offer?.itemType === "ERC1155";
  const assetHref = buildAssetHref("STARKNET", order.nftContract, order.nftTokenId);

  const unitPrice = order.price?.formatted ? parseFloat(order.price.formatted) : null;
  const totalPrice = unitPrice !== null ? unitPrice * quantity : null;

  const headline = is1155 && quantity > 1 ? `You own ${quantity} editions!` : "You own it!";

  return (
    <div className="flex flex-col">

      <div className="relative h-56 w-full bg-muted overflow-hidden shrink-0">
        {image ? (
          <Image src={image} alt={name ?? ""} fill className="object-cover" />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-primary/20 via-brand-purple/10 to-emerald-500/10 flex items-center justify-center">
            <CheckCircle2 className="h-16 w-16 text-emerald-500/40" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
        <div className="absolute bottom-4 left-4 right-4 flex items-end gap-3">
          <div className="h-9 w-9 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg border-2 border-white/20 shrink-0">
            <CheckCircle2 className="h-5 w-5 text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-white font-black text-xl leading-tight">{headline}</p>
            {name && (
              <p className="text-white/75 text-sm font-medium truncate mt-0.5">{name}</p>
            )}
          </div>
        </div>
      </div>

      <div className="px-5 py-5 space-y-4">

        <div className="rounded-xl border border-border divide-y divide-border text-sm">
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
          {txHash && (
            <div className="flex items-center justify-between px-4 py-2.5">
              <span className="text-muted-foreground">Transaction</span>
              <a
                href={`${EXPLORER_URL}/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 tabular-nums text-xs text-primary hover:underline"
              >
                {txHash.slice(0, 8)}…{txHash.slice(-6)}
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-2 w-full">
          <Button variant="outline" className="flex-1" asChild>
            <Link href={assetHref} onClick={onClose}>View asset</Link>
          </Button>
          <Button className="flex-1" onClick={onViewPortfolio}>
            View portfolio
          </Button>
        </div>
      </div>
    </div>
  );
}

export function PurchaseDialog({ order, open, onOpenChange, onSuccess }: PurchaseDialogProps) {
  const router = useRouter();
  const { fulfillOrder, hasWallet, walletAddress, resetState } = useMarketplace();

  const [step, setStep] = useState<Step>("details");
  const [quantity, setQuantity] = useState(1);
  const [successTxHash, setSuccessTxHash] = useState<string | null>(null);
  const [paymentSymbol, setPaymentSymbol] = useState<string | null>(null);

  const is1155 = order.offer?.itemType === "ERC1155";
  const maxQty = is1155
    ? Math.max(1, parseInt(order.remainingAmount ?? order.offer.startAmount ?? "1", 10))
    : 1;

  const requiredRaw = BigInt(order.consideration.startAmount ?? "0") * BigInt(is1155 ? quantity : 1);
  const orderCurrencyToken = order.price?.currency ? getTokenBySymbol(order.price.currency) : undefined;
  const { rawBalance: orderCurrencyBalance, isLoading: balanceLoading } = useErc20Balance(
    orderCurrencyToken?.address ?? null,
    walletAddress
  );

  const needsSwap = !balanceLoading && orderCurrencyBalance !== null && orderCurrencyBalance < requiredRaw;

  const handlePurchaseSuccess = (hash: string | null) => {
    setSuccessTxHash(hash ?? null);
    setStep("success");
    fireConfetti();
    rewardToast("buy_asset");
  };

  const {
    status,
    txHash,
    error,
    beginAction,
    resetActionFlow,
  } = useWalletMarketplaceActionFlow<{ quantity: number; paymentSymbol: string | null }>({
    hasWallet,
    executeAction: async (values) => {
      setStep("processing");
      const qty = is1155 ? String(values.quantity) : undefined;

      const feeQuantity = is1155 ? BigInt(values.quantity || 1) : 1n;
      const feeGrossAmount = BigInt(order.consideration.startAmount ?? "0") * feeQuantity;

      let swapCalls: import("starknet").Call[] | undefined;
      if (values.paymentSymbol && order.price?.currency && walletAddress) {
        try {
          const built = await buildSwapCalls({
            sell: values.paymentSymbol,
            buy: order.price.currency,
            amountRaw: feeGrossAmount.toString(),
            takerAddress: walletAddress,
          });
          swapCalls = built.calls;
        } catch {
          throw new Error("Price moved before the swap could be prepared — please try again.");
        }
      }

      const hash = await fulfillOrder({
        orderHash: order.orderHash,
        tokenStandard: order.offer.itemType,
        quantity: qty,
        feeToken: order.consideration.token ?? "",
        feeGrossAmount,
        swapCalls,
      });

      if (hash) {
        handlePurchaseSuccess(hash);
        return { txHash: hash };
      }
      setStep("details");
    },
  });

  const canBuy = !needsSwap || !!paymentSymbol;

  const handleBuyClick = () => {
    if (!hasWallet || !canBuy) return;
    beginAction({ quantity, paymentSymbol: needsSwap ? paymentSymbol : null });
  };

  const handleClose = (v: boolean) => {
    if (step === "processing" || step === "success") return;
    onOpenChange(v);
  };

  useEffect(() => {
    if (open) {
      resetState();
      resetActionFlow();
      setStep("details");
      setQuantity(1);
      setSuccessTxHash(null);
      setPaymentSymbol(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- resets dialog state on open; resetState/resetActionFlow aren't stable across renders and would re-fire this every render
  }, [open]);

  const processingMessage = "Confirming on Starknet…";
  const isTerminalError = status === "error";

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-[calc(100%-12px)] sm:max-w-md p-0 overflow-hidden gap-0 rounded-2xl">
          <DialogTitle className="sr-only">
            {step === "success" ? "Purchase complete" : step === "processing" ? "Processing purchase" : "Buy now"}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Confirm and complete this marketplace purchase with your Medialane wallet.
          </DialogDescription>

          {step === "success" ? (
            <SuccessScreen
              order={order}
              quantity={quantity}
              txHash={successTxHash ?? txHash}
              onClose={() => { onOpenChange(false); onSuccess?.(); }}
              onViewPortfolio={() => { onOpenChange(false); router.push("/portfolio/assets"); }}
            />

          ) : isTerminalError ? (
            <MarketplaceErrorState
              tokenImage={order.token?.image ? ipfsToHttp(order.token.image) : null}
              name={order.token?.name || `Token #${order.nftTokenId}`}
              title="Purchase failed"
              description="The transaction was submitted, but the purchase could not be completed."
              error={error}
              txHash={txHash}
              explorerUrl={EXPLORER_URL}
              onRetry={() => { resetState(); resetActionFlow(); setStep("details"); }}
              onDone={() => onOpenChange(false)}
            />

          ) : step === "processing" ? (

            <div className="flex flex-col items-center gap-4 p-6 py-10">
              <div className="relative">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
              </div>
              <div className="text-center space-y-1">
                <p className="text-sm font-medium">{processingMessage}</p>
                {txHash ? (
                  <MarketplaceTxLink txHash={txHash} explorerUrl={EXPLORER_URL} className="mt-1" />
                ) : null}
              </div>
              <p className="text-xs text-muted-foreground">Please wait, do not close this window.</p>
            </div>

          ) : (

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
                        aria-label="Decrease quantity"
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center text-sm font-medium">{quantity}</span>
                      <Button
                        variant="outline" size="icon" className="h-7 w-7"
                        disabled={quantity >= maxQty}
                        onClick={() => setQuantity(q => Math.min(maxQty, q + 1))}
                        aria-label="Increase quantity"
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                      <span className="text-xs text-muted-foreground ml-1">/ {maxQty}</span>
                    </div>
                  </div>
                )}

                {hasWallet && needsSwap && order.price?.currency && (
                  <PayWithPicker
                    orderCurrency={order.price.currency}
                    requiredRaw={requiredRaw}
                    walletAddress={walletAddress}
                    selected={paymentSymbol}
                    onSelect={setPaymentSymbol}
                  />
                )}

                {!hasWallet ? (
                  <p className="text-sm text-muted-foreground text-center py-2">
                    Secure your account to purchase this asset.
                  </p>
                ) : (
                  <div className={`btn-border-animated p-[1px] rounded-xl ${!canBuy ? "opacity-50 pointer-events-none" : ""}`}>
                    <button
                      className="w-full h-12 rounded-[11px] flex items-center justify-center gap-2 text-base font-semibold text-white transition-all hover:brightness-110 active:scale-[0.98] bg-transparent"
                      onClick={handleBuyClick}
                      disabled={!canBuy}
                    >
                      {error ? <RefreshCw className="h-4 w-4" /> : <ShoppingCart className="h-4 w-4" />}
                      {error ? "Try again" : needsSwap && !paymentSymbol ? "Select a token to pay with" : "Buy now"}
                    </button>
                  </div>
                )}

                <div className="flex items-start justify-center gap-1.5">
                  <ShieldCheck className="h-3 w-3 text-muted-foreground shrink-0 mt-0.5" />
                  <p className="text-[10px] text-center text-muted-foreground">
                    All purchases settle atomically onchain — your asset is transferred instantly with the payment. Gas is sponsored by Medialane.
                  </p>
                </div>
              </div>
            </div>
          )}

        </DialogContent>
      </Dialog>
    </>
  );
}
