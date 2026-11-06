"use client";

import { UserFacingError, OrderSummaryHero, TransactionDialogStates, successMessages, usdValueFor } from "@medialane/ui";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ShoppingCart, RefreshCw, Zap, Minus, Plus,
  ShieldCheck,
} from "lucide-react";
import { fireConfetti } from "@medialane/ui/utils/media-wallet/confetti";
import { RewardEarned } from "@medialane/ui";
import { assetHref as buildAssetHref } from "@/lib/routes";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@medialane/ui/dialog";
import { Button } from "@medialane/ui/button";
import { Alert, AlertDescription } from "@medialane/ui/alert";
import { useMarketplaceTransaction } from "@/hooks/use-marketplace-transaction";
import { useWalletNativeSession } from "@/hooks/use-wallet-native-session";
import { useWhenChanged } from "@/hooks/use-when-changed";
import { fulfillOrder } from "@/lib/marketplace-intents";
import type { ApiOrder } from "@medialane/sdk";
import { resolveImage } from "@/lib/utils";
import { useUsdPrices } from "@/hooks/use-usd-prices";
import { useErc20Balance } from "@medialane/ui/utils/media-wallet/use-erc20-balance";
import { getTokenBySymbol } from "@medialane/sdk";
import { createSwapIntent } from "@/lib/wallet/swap-calls";
import { getMedialaneClient } from "@/lib/medialane-client";
import { PayWithPicker } from "@/components/marketplace/pay-with-picker";

interface PurchaseDialogProps {
  order: ApiOrder;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}


export function PurchaseDialog({ order, open, onOpenChange, onSuccess }: PurchaseDialogProps) {
  const router = useRouter();
  const { address: walletAddress, hasWallet } = useWalletNativeSession();
  const { phase, busy, txHash, error, retryable, start, reset } = useMarketplaceTransaction();

  const [quantity, setQuantity] = useState(1);
  const [paymentSymbol, setPaymentSymbol] = useState<string | null>(null);

  const is1155 = order.offer?.itemType === "ERC1155";
  const maxQty = is1155
    ? Math.max(1, parseInt(order.remainingAmount ?? order.offer.startAmount ?? "1", 10))
    : 1;

  const usdPrices = useUsdPrices();
  const unitPrice = order.price?.formatted ? parseFloat(order.price.formatted) : null;
  const totalUsd = unitPrice !== null
    ? usdValueFor(String(unitPrice * quantity), order.price?.currency, usdPrices)
    : null;
  const assetName = order.token?.name || `Token #${order.nftTokenId}`;
  const assetImage = resolveImage(order.token?.image);

  const requiredRaw = BigInt(order.consideration.startAmount ?? "0") * BigInt(is1155 ? quantity : 1);
  const orderCurrencyToken = order.price?.currency ? getTokenBySymbol(order.price.currency) : undefined;
  const { rawBalance: orderCurrencyBalance, isLoading: balanceLoading } = useErc20Balance(orderCurrencyToken?.address ?? null,
    walletAddress
  );

  const needsSwap = !balanceLoading && orderCurrencyBalance !== null && orderCurrencyBalance < requiredRaw;

  const buy = async (values: { quantity: number; paymentSymbol: string | null }) => {
    const ok = await start(async (ctx) => {
      const qty = is1155 ? String(values.quantity) : undefined;

      const quantity = is1155 ? BigInt(values.quantity || 1) : 1n;
      const grossAmount = BigInt(order.consideration.startAmount ?? "0") * quantity;

      let swap: Awaited<ReturnType<typeof createSwapIntent>> | undefined;
      if (values.paymentSymbol && order.price?.currency && walletAddress) {
        try {
          swap = await createSwapIntent(getMedialaneClient().api, {
            sell: values.paymentSymbol,
            buy: order.price.currency,
            amountRaw: grossAmount.toString(),
            takerAddress: walletAddress,
          });
        } catch {
          throw new UserFacingError("Price moved before the swap could be prepared — please try again.");
        }
      }

      return fulfillOrder(ctx, {
        orderHash: order.orderHash,
        tokenStandard: order.offer.itemType,
        quantity: qty,
        swap,
      });
    });
    if (ok) fireConfetti();
  };

  const canBuy = !needsSwap || !!paymentSymbol;

  const handleBuyClick = () => {
    if (!hasWallet || !canBuy) return;
    void buy({ quantity, paymentSymbol: needsSwap ? paymentSymbol : null });
  };

  const isSuccess = phase === "success";

  const handleClose = (v: boolean) => {
    if (busy || isSuccess) return;
    onOpenChange(v);
  };

  useWhenChanged(open, () => {
    if (open) {
      reset();
      setQuantity(1);
      setPaymentSymbol(null);
    }
  });

  const processingMessage = "Confirming on Starknet…";

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-[calc(100%-12px)] sm:max-w-md p-0 overflow-hidden gap-0 rounded-2xl">
          <DialogTitle className="sr-only">
            {isSuccess ? "Purchase complete" : busy ? "Processing purchase" : "Buy now"}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Confirm and complete this marketplace purchase with your Medialane wallet.
          </DialogDescription>

          <TransactionDialogStates
            phase={phase}
            asset={{ name: assetName, image: assetImage }}
            statusMessage={processingMessage}
            txHash={txHash}
            error={error}
            success={successMessages.purchased({ name: order.token?.name ?? "the asset", quantity: is1155 ? quantity : 1 })}
            successActions={[
              {
                label: "View asset",
                href: buildAssetHref("STARKNET", order.nftContract, order.nftTokenId),
                onClick: () => { onOpenChange(false); onSuccess?.(); },
              },
              { label: "View portfolio", onClick: () => { onOpenChange(false); router.push("/portfolio/assets"); } },
            ]}
            successChildren={<RewardEarned actionType="buy_asset" />}
            errorTitle="Purchase failed"
            errorDescription="The transaction was submitted, but the purchase could not be completed."
            onRetry={retryable ? reset : undefined}
            onDone={() => onOpenChange(false)}
          >
              <div className="space-y-0">
                <OrderSummaryHero
                  name={assetName}
                  image={assetImage}
                  subtitle={
                    <span className="flex items-center gap-1">
                      <Zap className="h-3 w-3 text-emerald-500" />
                      <span className="text-emerald-500">Digital Asset Ownership</span>
                    </span>
                  }
                  price={order.price}
                  quantity={quantity}
                  usdTotal={totalUsd}
                />
                <div className="px-6 pb-6 pt-3 space-y-3">
                  {error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
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
                      onBeforeFund={() => onOpenChange(false)}
                    />
                  )}

                  {!hasWallet ? (
                    <p className="text-sm text-muted-foreground text-center py-2">
                      Secure your account to purchase this asset.
                    </p>
                  ) : error && !retryable ? (
                    <Button variant="secondary" className="w-full h-12 text-base font-semibold rounded-[11px]" onClick={() => onOpenChange(false)}>
                      Close
                    </Button>
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
                    <p className="text-2xs text-center text-muted-foreground">
                      All purchases settle atomically onchain — your asset is transferred instantly with the payment. Gas is sponsored by Medialane.
                    </p>
                  </div>
                </div>
              </div>
          
          </TransactionDialogStates>
        </DialogContent>
      </Dialog>
    </>
  );
}
