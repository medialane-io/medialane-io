"use client";

import { useState } from "react";
import { useUserOrders, useCounterOffers } from "@/hooks/use-orders";
import { assetHref } from "@/lib/routes";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyOrError } from "@/components/ui/empty-or-error";
import { PinDialog } from "@/components/chipi/pin-dialog";
import { useWriteAction } from "@/hooks/use-write-action";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useMarketplace } from "@/hooks/use-marketplace";
import { useFeeCharge } from "@/hooks/use-fee-charge";
import { ipfsToHttp, formatDisplayPrice, formatExpiry, cn } from "@/lib/utils";
import { AlertCircle, ArrowLeftRight, CheckCircle2, ExternalLink, Inbox, Loader2, Sparkles } from "lucide-react";
import { EXPLORER_URL } from "@/lib/constants";
import Image from "next/image";
import Link from "next/link";
import type { ApiOrder } from "@medialane/sdk";


/**
 * Fetches and renders a single counter-offer row for one original bid.
 * Isolated into its own component to safely use SWR hooks per bid.
 */
function CounterOfferFetcher({
  originalBid,
  isProcessing,
  onAccept,
}: {
  originalBid: ApiOrder;
  isProcessing: boolean;
  onAccept: (counter: ApiOrder, original: ApiOrder) => void;
}) {
  const { counterOffers } = useCounterOffers({ originalOrderHash: originalBid.orderHash });
  const counter = counterOffers[0];
  if (!counter) return null;

  const name = counter.token?.name || `#${counter.nftTokenId}`;
  const image = counter.token?.image ? ipfsToHttp(counter.token.image) : null;
  const expiry = formatExpiry(counter.endTime);
  const isExpiredOrFilled = counter.status !== "ACTIVE" || expiry.expired;

  return (
    <div className="flex items-center gap-4 px-4 py-3 hover:bg-muted/40 transition-colors">
      <div className="relative h-12 w-12 rounded-lg overflow-hidden border border-border shrink-0 bg-gradient-to-br from-muted to-muted-foreground/20">
        {image && <Image src={image} alt={name} fill unoptimized sizes="48px" className="object-cover" />}
      </div>

      <div className="flex-1 min-w-0">
        <Link
          href={assetHref("STARKNET", counter.nftContract, counter.nftTokenId)}
          className="font-medium text-sm hover:text-primary transition-colors truncate block"
        >
          {name}
        </Link>
        <div className="flex items-center gap-1.5 mt-0.5">
          <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
            <ArrowLeftRight className="h-2.5 w-2.5 mr-1" />
            Counter-offer
          </Badge>
        </div>
      </div>

      {/* Original bid → Counter price */}
      <div className="shrink-0 hidden sm:flex flex-col items-end gap-0.5">
        <p className="text-xs text-muted-foreground line-through">
          {formatDisplayPrice(originalBid.price.formatted)} {originalBid.price.currency}
        </p>
        <p className="text-sm font-semibold">
          {counter.price.formatted
            ? `${formatDisplayPrice(counter.price.formatted)} ${counter.price.currency ?? ""}`
            : "—"}
        </p>
      </div>

      <div className="shrink-0 hidden md:block">
        <p className={cn(
          "text-sm",
          expiry.expired && "text-muted-foreground",
          expiry.urgent && !expiry.expired && "text-destructive font-medium"
        )}>
          {expiry.label}
        </p>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {counter.txHash.created && (
          <a
            href={`${EXPLORER_URL}/tx/${counter.txHash.created}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center h-7 w-7 rounded-md hover:bg-muted transition-colors"
            aria-label="View on Voyager"
          >
            <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
          </a>
        )}
        <Button
          size="sm"
          variant="default"
          className="h-8 text-xs"
          disabled={isProcessing || isExpiredOrFilled}
          onClick={() => onAccept(counter, originalBid)}
        >
          {isExpiredOrFilled ? (counter.status !== "ACTIVE" ? counter.status : "Expired") : "Accept"}
        </Button>
      </div>
    </div>
  );
}

export function CounterOffersTable({ address }: { address: string }) {
  const { orders, isLoading, error, mutate } = useUserOrders(address);
  const { fulfillOrder, isProcessing } = useMarketplace();
  const { chargeFee } = useFeeCharge();
  const action = useWriteAction();
  const [selectedCounter, setSelectedCounter] = useState<ApiOrder | null>(null);
  const [originalForSelected, setOriginalForSelected] = useState<ApiOrder | null>(null);
  // The existing processing → success/error result dialog is driven by the
  // unified action state (so the user never has to check the explorer).
  const resultStep = action.status;
  const resultTxHash = action.txHash;
  const resultError = action.error;

  // My bids that the seller has countered.
  // Predicate: ERC-20 offer (bid) I made + the backend-derived flag
  // `hasActiveCounterOffer` is true. The flag was added in SDK 0.22.0
  // alongside backend support; it replaces the legacy
  // `status === "COUNTER_OFFERED"` check (audit P0-1, 01-core-model §V —
  // counter-offers are linked orders, not a third lifecycle state).
  // The parent bid keeps `status: ACTIVE`.
  const counterOfferedBids = orders.filter(
    (o) =>
      o.offer.itemType === "ERC20" &&
      o.offerer.toLowerCase() === address.toLowerCase() &&
      o.hasActiveCounterOffer === true
  );

  const handleAccept = (counter: ApiOrder, original: ApiOrder) => {
    setSelectedCounter(counter);
    setOriginalForSelected(original);
    // Pass `counter` through the closure — the passkey path runs synchronously,
    // before the setSelectedCounter above settles.
    void action.run((secret) => handleUnlocked(counter, secret));
  };

  // `secret` is the wallet-unlock material — a typed PIN or the passkey key.
  // action owns status/error; this returns the result and throws on failure.
  const handleUnlocked = async (counter: ApiOrder, secret: string) => {
    const hash = await fulfillOrder({
      orderHash: counter.orderHash,
      pin: secret,
      tokenStandard: counter.consideration.itemType,
    });
    if (!hash) {
      mutate();
      // fulfillOrder swallowed an error internally and returned undefined.
      throw new Error(
        "We couldn't complete the counter-offer accept. The transaction may have been rejected or the order may have expired. Please refresh and try again."
      );
    }
    // Fee — fire-and-forget post-confirm. Buyer (this user) bears the platform
    // fee on the counter-listing's ERC-20 amount, same as a listing purchase.
    const feeGrossAmount = BigInt(counter.consideration.startAmount ?? "0");
    console.info("[medialane] platform fee queued", {
      surface: "marketplace",
      orderHash: counter.orderHash,
      token: counter.consideration.token,
      grossAmount: feeGrossAmount.toString(),
    });
    chargeFee({
      surface: "marketplace",
      token: counter.consideration.token ?? "",
      grossAmount: feeGrossAmount,
      pin: secret,
    });
    mutate();
    return { status: "confirmed", txHash: hash };
  };

  const dismissResult = () => {
    // Block dismissal while the tx is in flight — same UX as purchase / listing.
    if (action.status === "processing" || action.status === "confirming") return;
    action.reset();
    setSelectedCounter(null);
    setOriginalForSelected(null);
  };

  const counterDisplayName =
    selectedCounter?.token?.name || `#${selectedCounter?.nftTokenId ?? ""}`;
  const counterImage = selectedCounter?.token?.image
    ? ipfsToHttp(selectedCounter.token.image)
    : null;

  return (
    <>
      <EmptyOrError
        isLoading={isLoading}
        error={error}
        isEmpty={counterOfferedBids.length === 0}
        onRetry={mutate}
        emptyTitle="No counter-offers yet"
        emptyDescription="When a seller responds to your bid with a counter-offer, it will appear here."
        emptyIcon={<Inbox className="h-7 w-7 text-muted-foreground" />}
        skeletonCount={3}
      >
        <div className="rounded-lg border border-border overflow-hidden">
          <div className="flex items-center gap-4 px-4 py-2 text-xs uppercase tracking-wide text-muted-foreground border-b border-border bg-muted/30">
            <div className="w-12 shrink-0" />
            <div className="flex-1">Asset</div>
            <div className="hidden sm:block w-40 text-right">Their price / Your bid</div>
            <div className="hidden md:block w-28">Expires</div>
            <div className="w-24 text-right">Actions</div>
          </div>
          {counterOfferedBids.map((bid) => (
            <CounterOfferFetcher
              key={bid.orderHash}
              originalBid={bid}
              isProcessing={isProcessing}
              onAccept={handleAccept}
            />
          ))}
        </div>
      </EmptyOrError>

      <PinDialog
        {...action.pinDialogProps}
        title="Accept counter-offer"
        description={
          selectedCounter && originalForSelected
            ? `Accept seller's counter of ${formatDisplayPrice(selectedCounter.price.formatted ?? "")} ${selectedCounter.price.currency ?? ""} for ${selectedCounter.token?.name || `#${selectedCounter.nftTokenId}`}?`
            : "Enter your PIN to accept the counter-offer."
        }
      />

      {/* Processing / success / error feedback dialog. Opens automatically
          after PinDialog submit; user can only dismiss success/error. */}
      <Dialog
        open={resultStep !== "idle"}
        onOpenChange={(v) => { if (!v) dismissResult(); }}
      >
        <DialogContent className="max-w-[calc(100%-6px)] sm:max-w-md p-0 overflow-hidden gap-0 rounded-2xl">
          <DialogTitle className="sr-only">Counter-offer accept</DialogTitle>
          <DialogDescription className="sr-only">
            On-chain status for the counter-offer you accepted.
          </DialogDescription>

          {/* Token hero (image + name) — shared across all result states */}
          <div className="flex flex-col items-center gap-3 pt-6 px-6">
            <div className="relative h-24 w-24 rounded-xl overflow-hidden border border-border bg-gradient-to-br from-muted to-muted-foreground/20">
              {counterImage && (
                <Image
                  src={counterImage}
                  alt={counterDisplayName}
                  fill
                  unoptimized
                  sizes="96px"
                  className="object-cover"
                />
              )}
              {resultStep === "success" && (
                <div className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-background flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                </div>
              )}
            </div>
            <p className="font-semibold text-base text-center truncate w-full">
              {counterDisplayName}
            </p>
          </div>

          {resultStep === "processing" && (
            <div className="flex flex-col items-center gap-4 p-6 pt-3">
              <Loader2 className="h-7 w-7 animate-spin text-primary" />
              <div className="text-center space-y-1">
                <p className="font-semibold">Confirming on Starknet…</p>
                <p className="text-xs text-muted-foreground">
                  Please wait, do not close this window.
                </p>
              </div>
            </div>
          )}

          {resultStep === "success" && (
            <div className="flex flex-col items-center gap-4 p-6 pt-3">
              <div className="text-center space-y-1">
                <p className="font-bold text-lg flex items-center justify-center gap-1.5">
                  Counter-offer accepted
                  <Sparkles className="h-4 w-4 text-yellow-400" />
                </p>
                <p className="text-sm text-muted-foreground">
                  The token is now yours.
                </p>
              </div>
              {resultTxHash && (
                <a
                  href={`${EXPLORER_URL}/tx/${resultTxHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors font-mono"
                >
                  {resultTxHash.slice(0, 10)}…{resultTxHash.slice(-8)}
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
              <Button className="w-full h-11" onClick={dismissResult}>
                Done
              </Button>
            </div>
          )}

          {resultStep === "error" && (
            <div className="flex flex-col items-center gap-4 p-6 pt-3">
              <div className="h-12 w-12 rounded-full bg-destructive/15 flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-destructive" />
              </div>
              <div className="text-center space-y-1">
                <p className="font-bold text-base">Accept failed</p>
                <p className="text-sm text-muted-foreground">{resultError}</p>
              </div>
              <Button variant="outline" className="w-full h-11" onClick={dismissResult}>
                Close
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
