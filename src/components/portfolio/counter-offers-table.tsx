"use client";

import { useState } from "react";
import { useUserOrders, useCounterOffers } from "@/hooks/use-orders";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyOrError } from "@/components/ui/empty-or-error";
import { PinDialog } from "@/components/chipi/pin-dialog";
import { useMarketplace } from "@/hooks/use-marketplace";
import { ipfsToHttp, formatDisplayPrice, cn } from "@/lib/utils";
import { ArrowLeftRight, ExternalLink, Inbox } from "lucide-react";
import { EXPLORER_URL } from "@/lib/constants";
import { formatDistanceToNow } from "date-fns";
import Image from "next/image";
import Link from "next/link";
import type { ApiOrder } from "@medialane/sdk";

function formatExpiry(endTime: string | bigint) {
  const expiry = new Date(Number(endTime) * 1000);
  const now = new Date();
  if (expiry < now) return { label: "Expired", urgent: false, expired: true };
  const urgent = expiry.getTime() - now.getTime() < 86400000;
  return { label: formatDistanceToNow(expiry, { addSuffix: true }), urgent, expired: false };
}

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
        {image && <Image src={image} alt={name} fill className="object-cover" />}
      </div>

      <div className="flex-1 min-w-0">
        <Link
          href={`/asset/${counter.nftContract}/${counter.nftTokenId}`}
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
  const [pinOpen, setPinOpen] = useState(false);
  const [selectedCounter, setSelectedCounter] = useState<ApiOrder | null>(null);
  const [originalForSelected, setOriginalForSelected] = useState<ApiOrder | null>(null);

  // My bids that the seller has countered
  const counterOfferedBids = orders.filter(
    (o) =>
      o.offer.itemType === "ERC20" &&
      o.offerer.toLowerCase() === address.toLowerCase() &&
      o.status === "COUNTER_OFFERED"
  );

  const handleAccept = (counter: ApiOrder, original: ApiOrder) => {
    setSelectedCounter(counter);
    setOriginalForSelected(original);
    setPinOpen(true);
  };

  const handlePin = async (pin: string) => {
    setPinOpen(false);
    if (!selectedCounter) return;
    await fulfillOrder({ orderHash: selectedCounter.orderHash, pin });
    mutate();
  };

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
        open={pinOpen}
        onSubmit={handlePin}
        onCancel={() => { setPinOpen(false); setSelectedCounter(null); setOriginalForSelected(null); }}
        title="Accept counter-offer"
        description={
          selectedCounter && originalForSelected
            ? `Accept seller's counter of ${formatDisplayPrice(selectedCounter.price.formatted ?? "")} ${selectedCounter.price.currency ?? ""} for ${selectedCounter.token?.name || `#${selectedCounter.nftTokenId}`}?`
            : "Enter your PIN to accept the counter-offer."
        }
      />
    </>
  );
}
