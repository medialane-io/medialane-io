"use client";

import { UserFacingError, OrderSummaryHero, TransactionDialogStates, successMessages, usdValueFor, ActionButton } from "@medialane/ui";
import { useState } from "react";
import { useRouter } from "@medialane/ui/router";
import { ShoppingCart, RefreshCw, Zap, Minus, Plus } from "lucide-react";
import { useConfetti } from "@medialane/ui/utils/use-confetti";
import { RewardEarned } from "@medialane/ui";
import { assetHref as buildAssetHref } from "@/lib/routes";
import { Button } from "@medialane/ui/button";
import { MarketplaceDialog, DialogErrorAlert, DialogNote } from "@/components/marketplace/dialog-frame";
import { useMarketplaceTransaction } from "@/hooks/use-marketplace-transaction";
import { useWalletNativeSession } from "@/hooks/use-wallet-native-session";
import { useOnOpen } from "@medialane/ui/utils/use-on-open";
import { fulfillOrder } from "@/lib/marketplace-intents";
import type { ApiOrder } from "@medialane/sdk";
import { resolveImage } from "@/lib/utils";
import { useUsdPrices } from "@medialane/ui/utils/use-usd-prices";
import { useErc20Balance } from "@medialane/ui/utils/media-wallet/use-erc20-balance";
import { getTokenBySymbol } from "@medialane/sdk";
import { createSwapIntent } from "@/lib/wallet/swap-calls";
import { getMedialaneClient, purchaseTotal } from "@/lib/medialane-client";
import { PayWithPicker } from "@/components/marketplace/pay-with-picker";
import { useT } from "@medialane/ui/i18n";

interface PurchaseDialogProps {
  order: ApiOrder;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}


export function PurchaseDialog({ order, open, onOpenChange, onSuccess }: PurchaseDialogProps) {
  const t = useT();
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

  const requiredRaw = purchaseTotal(BigInt(order.consideration.startAmount ?? "0") * BigInt(is1155 ? quantity : 1));
  const orderCurrencyToken = order.price?.currency ? getTokenBySymbol(order.price.currency) : undefined;
  const { rawBalance: orderCurrencyBalance, isLoading: balanceLoading } = useErc20Balance(orderCurrencyToken?.address ?? null,
    walletAddress
  );

  const needsSwap = !balanceLoading && orderCurrencyBalance !== null && orderCurrencyBalance < requiredRaw;

  const buy = async (values: { quantity: number; paymentSymbol: string | null }) => {
    await start(async (ctx) => {
      const qty = is1155 ? String(values.quantity) : undefined;

      const quantity = is1155 ? BigInt(values.quantity || 1) : 1n;
      const grossAmount = BigInt(order.consideration.startAmount ?? "0") * quantity;

      let swap: Awaited<ReturnType<typeof createSwapIntent>> | undefined;
      if (values.paymentSymbol && order.price?.currency && walletAddress) {
        try {
          swap = await createSwapIntent(getMedialaneClient(), {
            sell: values.paymentSymbol,
            buy: order.price.currency,
            amountRaw: purchaseTotal(grossAmount).toString(),
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
  };

  const canBuy = !needsSwap || !!paymentSymbol;

  const handleBuyClick = () => {
    if (!hasWallet || !canBuy) return;
    void buy({ quantity, paymentSymbol: needsSwap ? paymentSymbol : null });
  };

  const isSuccess = phase === "success";
  useConfetti(isSuccess);

  const handleClose = (v: boolean) => {
    if (busy || isSuccess) return;
    onOpenChange(v);
  };

  useOnOpen(open, () => {
    reset();
    setQuantity(1);
    setPaymentSymbol(null);
  });

  return (
    <MarketplaceDialog
      open={open}
      onOpenChange={handleClose}
      title={isSuccess ? t("Purchase complete") : busy ? t("Processing purchase") : t("Buy now")}
      description={t("Confirm and complete this marketplace purchase with your Medialane wallet.")}
    >
      <TransactionDialogStates
        phase={phase}
        asset={{ name: assetName, image: assetImage }}
        txHash={txHash}
        error={error}
        success={successMessages.purchased({ name: order.token?.name ?? "the asset", quantity: is1155 ? quantity : 1 }, t)}
        successActions={[
          {
            label: t("View asset"),
            href: buildAssetHref("STARKNET", order.nftContract, order.nftTokenId),
            onClick: () => { onOpenChange(false); onSuccess?.(); },
          },
          { label: t("View portfolio"), onClick: () => { onOpenChange(false); router.push("/portfolio/assets"); } },
        ]}
        successChildren={<RewardEarned actionType="buy_asset" />}
        errorTitle={t("Purchase failed")}
        errorDescription={t("The transaction was submitted, but the purchase could not be completed.")}
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
                <span className="text-emerald-500">{t("Digital asset ownership")}</span>
              </span>
            }
            price={order.price}
            quantity={quantity}
            usdTotal={totalUsd}
          />
          <div className="px-6 pb-6 pt-3 space-y-3">
            <DialogErrorAlert error={error} />

            {is1155 && maxQty > 1 && (
              <div className="flex items-center justify-between py-1">
                <span className="text-sm text-muted-foreground">{t("Quantity")}</span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="soft" size="icon" className="h-7 w-7"
                    disabled={quantity <= 1}
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    aria-label={t("Decrease quantity")}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="w-8 text-center text-sm font-medium">{quantity}</span>
                  <Button
                    variant="soft" size="icon" className="h-7 w-7"
                    disabled={quantity >= maxQty}
                    onClick={() => setQuantity(q => Math.min(maxQty, q + 1))}
                    aria-label={t("Increase quantity")}
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
                {t("Secure your account to purchase this asset.")}
              </p>
            ) : error && !retryable ? (
              <Button variant="secondary" className="w-full h-12 text-base font-semibold rounded-[11px]" onClick={() => onOpenChange(false)}>
                {t("Close")}
              </Button>
            ) : (
              <ActionButton solid className="w-full" onClick={handleBuyClick} disabled={!canBuy}>
                {error ? <RefreshCw className="h-4 w-4" /> : <ShoppingCart className="h-4 w-4" />}
                {error ? t("Try again") : needsSwap && !paymentSymbol ? t("Select a token to pay with") : t("Buy now")}
              </ActionButton>
            )}

            <DialogNote>{t("Purchases settle atomically onchain and assets transfer instantly.")}</DialogNote>
          </div>
        </div>
      </TransactionDialogStates>
    </MarketplaceDialog>
  );
}
