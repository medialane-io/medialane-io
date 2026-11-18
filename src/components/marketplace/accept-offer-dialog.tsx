"use client";

import { MarketplaceDialog } from "@/components/marketplace/dialog-frame";
import { RewardEarned, formatDisplayPrice } from "@medialane/ui";
import {
  MarketplaceDialogHero,
  MarketplaceConfirmStep,
  TransactionDialogStates,
  successMessages,
} from "@medialane/ui";
import { Alert, AlertDescription } from "@medialane/ui/alert";
import { AlertTriangle, HandCoins, Tag, X } from "lucide-react";
import { resolveImage } from "@/lib/utils";
import type { AcceptOfferHook } from "@/hooks/use-accept-offer";
import type { ApiOrder } from "@medialane/sdk";
import { useT } from "@medialane/ui/i18n";

interface AcceptOfferDialogProps {
  hook: AcceptOfferHook;

  tokenName?: string;

  tokenImage?: string | null;

  onCancelListing?: (order: ApiOrder) => void;
}

export function AcceptOfferDialog({ hook, tokenName, tokenImage, onCancelListing }: AcceptOfferDialogProps) {
  const t = useT();
  const {
    isOpen,
    selectedOrder,
    buyerHasFunds,
    phase,
    busy,
    txHash,
    error,
    retryable,
    confirmAccept,
    dismiss,
    warningOpen,
    activeListings,
    proceedFromWarning,
    dismissWarning,
  } = hook;

  const name =
    selectedOrder?.token?.name ?? tokenName ?? `Token #${selectedOrder?.nftTokenId ?? ""}`;
  const rawImage = selectedOrder?.token?.image ?? tokenImage ?? null;
  const image = resolveImage(rawImage);

  const priceLabel = selectedOrder
    ? `${formatDisplayPrice(selectedOrder.price.formatted)} ${selectedOrder.price.currency}`
    : "";

  const handleOpenChange = (v: boolean) => {
    if (!v && busy) return;
    if (!v) dismiss();
  };

  return (
    <MarketplaceDialog
      open={isOpen}
      onOpenChange={handleOpenChange}
      title={`Accept offer on ${name}`}
      description={`Accept offer for ${name}.`}
    >
      {warningOpen ? (
        <div className="flex flex-col p-5 gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/10">
              <AlertTriangle className="h-4.5 w-4.5 text-amber-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{t("Active listing detected")}</p>
              <p className="mt-1 text-xs text-muted-foreground">{t.rich("Accepting this offer will transfer the NFT, leaving {value} unfulfillable. Cancel {value2} first to keep the marketplace clean.", { value: activeListings.length === 1 ? "your listing" : `your ${activeListings.length} listings`, value2: activeListings.length === 1 ? "it" : "them" })}</p>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            {activeListings.map((listing) => (
              <div
                key={listing.orderHash}
                className="flex items-center justify-between gap-3 rounded-xl border border-border/40 bg-muted/20 px-3 py-2.5"
              >
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Tag className="h-3.5 w-3.5 shrink-0" />
                  <span>
                    {t("Listed for")}{" "}
                    <span className="font-medium text-foreground">
                      {formatDisplayPrice(listing.price.formatted)} {listing.price.currency}
                    </span>
                  </span>
                </div>
                {onCancelListing && (
                  <button
                    onClick={() => { onCancelListing(listing); dismissWarning(); }}
                    className="flex items-center gap-1 rounded-lg border border-destructive/30 bg-destructive/10 px-2.5 py-1.5 text-xs font-medium text-destructive transition-colors hover:bg-destructive/20"
                  >
                    <X className="h-3 w-3" />
                    {t("Cancel listing")}
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <button
              onClick={dismissWarning}
              className="flex-1 h-9 rounded-xl border border-border/50 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/50"
            >
              {t("Dismiss")}
            </button>
            <button
              onClick={proceedFromWarning}
              className="flex-1 h-9 rounded-xl bg-primary text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              {t("Accept anyway")}
            </button>
          </div>
        </div>
      ) : (
        <TransactionDialogStates
          phase={phase}
          asset={{ name, image }}
          txHash={txHash}
          error={error}
          success={successMessages.accepted({ name, price: priceLabel }, t)}
          successChildren={<RewardEarned actionType="offer_accepted_seller" />}
          errorTitle={t("Offer acceptance failed")}
          errorDescription={t("The transaction could not be completed. Your asset is still listed.")}
          onRetry={retryable ? confirmAccept : undefined}
          onDone={dismiss}
        >
          <MarketplaceDialogHero
            tokenImage={image}
            tokenName={name}
            tokenId={selectedOrder?.nftTokenId ?? ""}
            fallbackIcon={<HandCoins className="h-10 w-10 text-muted-foreground" />}
          />
          <MarketplaceConfirmStep
            description={`Accept ${priceLabel}?`}
            summary={
              buyerHasFunds === false ? (
                <Alert className="border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  <AlertDescription className="text-xs">{t("Buyer may have insufficient {currency}. The offer stays active if the payment fails.", { currency: selectedOrder?.price.currency ?? "" })}</AlertDescription>
                </Alert>
              ) : null
            }
            error={error}
            secondaryLabel={t("Cancel")}
            onSecondary={dismiss}
            primaryLabel={t("Accept offer")}
            onPrimary={confirmAccept}
          />
        </TransactionDialogStates>
      )}
    </MarketplaceDialog>
  );
}
