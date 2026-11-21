"use client";

import { UserFacingError, PurchasePanel, TransactionDialogStates, successMessages, ActionButton, useMediaWallet } from "@medialane/ui";
import { useState } from "react";
import { useRouter } from "@medialane/ui/router";
import { ShoppingCart, RefreshCw } from "lucide-react";
import { useConfetti } from "@medialane/ui/utils/use-confetti";
import { RewardEarned } from "@medialane/ui";
import { assetHref as buildAssetHref } from "@/lib/routes";
import { Button } from "@medialane/ui/button";
import { MarketplaceDialog } from "@/components/marketplace/dialog-frame";
import { useMarketplaceTransaction } from "@/hooks/use-marketplace-transaction";
import { useWalletNativeSession } from "@/hooks/use-wallet-native-session";
import { useOnOpen } from "@medialane/ui/utils/use-on-open";
import { fulfillOrder } from "@/lib/marketplace-intents";
import type { ApiOrder } from "@medialane/sdk";
import { resolveImage } from "@/lib/utils";
import { createSwapIntent } from "@/lib/wallet/swap-calls";
import { getMedialaneClient, marketplaceFeeBps, purchaseTotal } from "@/lib/medialane-client";
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

  const assetName = order.token?.name || `Token #${order.nftTokenId}`;
  const assetImage = resolveImage(order.token?.image);
  const requiredRaw = purchaseTotal(BigInt(order.consideration.startAmount ?? "0") * BigInt(is1155 ? quantity : 1));
  const swapFrom = paymentSymbol && paymentSymbol !== order.price?.currency ? paymentSymbol : null;

  const { open: openWalletPanel } = useMediaWallet();
  const addFunds = () => {
    onOpenChange(false);
    openWalletPanel({ name: "home", autoOpenReceive: true });
  };

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

  const handleBuyClick = () => {
    if (!hasWallet || !paymentSymbol) return;
    void buy({ quantity, paymentSymbol: swapFrom });
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
        <PurchasePanel
          name={assetName}
          image={assetImage}
          price={order.price}
          available={is1155 ? maxQty : null}
          quantity={quantity}
          onQuantityChange={setQuantity}
          amountRaw={requiredRaw}
          feeBps={marketplaceFeeBps()}
          walletAddress={hasWallet ? walletAddress : null}
          payWith={paymentSymbol}
          onPayWithChange={setPaymentSymbol}
          onAddFunds={addFunds}
          error={error}
        >
          {!hasWallet ? (
            <p className="text-sm text-muted-foreground text-center py-2">
              {t("Secure your account to purchase this asset.")}
            </p>
          ) : error && !retryable ? (
            <Button variant="secondary" className="w-full h-12 text-base font-semibold rounded-[11px]" onClick={() => onOpenChange(false)}>
              {t("Close")}
            </Button>
          ) : (
            <ActionButton solid className="w-full" onClick={handleBuyClick} disabled={!paymentSymbol}>
              {error ? <RefreshCw className="h-4 w-4" /> : <ShoppingCart className="h-4 w-4" />}
              {error ? t("Try again") : t("Buy now")}
            </ActionButton>
          )}
        </PurchasePanel>
      </TransactionDialogStates>
    </MarketplaceDialog>
  );
}
