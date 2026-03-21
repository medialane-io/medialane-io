"use client";

import { useState } from "react";
import { useUserOrders } from "@/hooks/use-orders";
import { Button } from "@/components/ui/button";
import { EmptyOrError } from "@/components/ui/empty-or-error";
import { PinDialog } from "@/components/chipi/pin-dialog";
import { useMarketplace } from "@/hooks/use-marketplace";
import { ipfsToHttp, formatDisplayPrice, cn } from "@/lib/utils";
import { ExternalLink, Inbox } from "lucide-react";
import { EXPLORER_URL } from "@/lib/constants";
import { formatDistanceToNow } from "date-fns";
import { getSeenOffers } from "@/hooks/use-unread-offers";
import Image from "next/image";
import Link from "next/link";
import type { ApiOrder } from "@medialane/sdk";

interface ReceivedOffersTableProps {
  address: string;
}

function formatExpiry(endTime: string | bigint) {
  const expiry = new Date(Number(endTime) * 1000);
  const now = new Date();
  if (expiry < now) return { label: "Expired", urgent: false, expired: true };
  const urgent = expiry.getTime() - now.getTime() < 86400000;
  return { label: formatDistanceToNow(expiry, { addSuffix: true }), urgent, expired: false };
}

function ReceivedOfferRow({
  order,
  isProcessing,
  onAccept,
  isNew,
}: {
  order: ApiOrder;
  isProcessing: boolean;
  onAccept: (order: ApiOrder) => void;
  isNew: boolean;
}) {
  const name = order.token?.name || `#${order.nftTokenId}`;
  const image = order.token?.image ? ipfsToHttp(order.token.image) : null;
  const expiry = formatExpiry(order.endTime);

  return (
    <div className={cn(
      "flex items-center gap-4 px-4 py-3 hover:bg-muted/40 transition-colors",
      isNew && "border-l-2 border-primary"
    )}>
      {/* Thumbnail */}
      <div className="relative h-12 w-12 rounded-lg overflow-hidden border border-border shrink-0 bg-gradient-to-br from-muted to-muted-foreground/20">
        {image && <Image src={image} alt={name} fill className="object-cover" />}
      </div>

      {/* Asset */}
      <div className="flex-1 min-w-0">
        <Link
          href={`/asset/${order.nftContract}/${order.nftTokenId}`}
          className="font-medium text-sm hover:text-primary transition-colors truncate block"
        >
          {name}
        </Link>
        <span className="text-xs text-muted-foreground">Received offer</span>
      </div>

      {/* From */}
      <div className="shrink-0 hidden sm:block">
        <Link
          href={`/creators/${order.offerer}`}
          className="text-xs text-muted-foreground font-mono hover:text-foreground transition-colors"
        >
          {order.offerer.slice(0, 6)}…{order.offerer.slice(-4)}
        </Link>
      </div>

      {/* Offer price */}
      <div className="text-right shrink-0 hidden sm:block">
        <p className="text-sm font-semibold">
          {formatDisplayPrice(order.price.formatted)}{" "}
          <span className="text-muted-foreground font-normal text-xs">{order.price.currency}</span>
        </p>
      </div>

      {/* Expires */}
      <div className="shrink-0 hidden md:block">
        <p className={cn("text-sm", expiry.expired && "text-muted-foreground", expiry.urgent && "text-destructive font-medium")}>
          {expiry.label}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 shrink-0">
        <a
          href={`${EXPLORER_URL}/tx/${order.txHash.created}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center h-7 w-7 rounded-md hover:bg-muted transition-colors"
          aria-label="View on explorer"
        >
          <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
        </a>
        <Button
          size="sm"
          variant="default"
          className="h-8 text-xs"
          disabled={isProcessing}
          onClick={() => onAccept(order)}
        >
          Accept
        </Button>
      </div>
    </div>
  );
}

export function ReceivedOffersTable({ address }: ReceivedOffersTableProps) {
  const { orders, isLoading, error, mutate } = useUserOrders(address);
  const { fulfillOrder, isProcessing } = useMarketplace();
  const [pinOpen, setPinOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<ApiOrder | null>(null);

  const seenHashes = getSeenOffers();

  const receivedOffers = orders.filter(
    (o) =>
      o.offer.itemType === "ERC20" &&
      o.status === "ACTIVE" &&
      o.offerer.toLowerCase() !== address.toLowerCase()
  );

  const handleAccept = (order: ApiOrder) => {
    setSelectedOrder(order);
    setPinOpen(true);
  };

  const handlePin = async (pin: string) => {
    setPinOpen(false);
    if (!selectedOrder) return;
    await fulfillOrder({ orderHash: selectedOrder.orderHash, pin });
    mutate();
  };

  return (
    <>
      <EmptyOrError
        isLoading={isLoading}
        error={error}
        isEmpty={receivedOffers.length === 0}
        onRetry={mutate}
        emptyTitle="No offers received yet"
        emptyDescription="When someone makes an offer on your asset, it will appear here."
        emptyIcon={<Inbox className="h-7 w-7 text-muted-foreground" />}
        skeletonCount={3}
      >
        <div className="rounded-lg border border-border overflow-hidden">
          {/* Column headers */}
          <div className="flex items-center gap-4 px-4 py-2 text-xs uppercase tracking-wide text-muted-foreground border-b border-border bg-muted/30">
            <div className="w-12 shrink-0" />
            <div className="flex-1">Asset</div>
            <div className="hidden sm:block w-28">From</div>
            <div className="hidden sm:block w-24 text-right">Offer price</div>
            <div className="hidden md:block w-28">Expires</div>
            <div className="w-24 text-right">Actions</div>
          </div>
          {receivedOffers.map((order) => (
            <ReceivedOfferRow
              key={order.orderHash}
              order={order}
              isProcessing={isProcessing}
              onAccept={handleAccept}
              isNew={!seenHashes.has(order.orderHash)}
            />
          ))}
        </div>
      </EmptyOrError>

      <PinDialog
        open={pinOpen}
        onSubmit={handlePin}
        onCancel={() => { setPinOpen(false); setSelectedOrder(null); }}
        title="Accept offer"
        description={selectedOrder
          ? `Accept ${formatDisplayPrice(selectedOrder.price.formatted)} ${selectedOrder.price.currency} for token #${selectedOrder.nftTokenId}?`
          : "Enter your PIN to accept this offer."}
      />
    </>
  );
}
