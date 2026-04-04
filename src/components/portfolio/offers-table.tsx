"use client";

import { useState } from "react";
import { useUserOrders } from "@/hooks/use-orders";
import { Button } from "@/components/ui/button";
import { EmptyOrError } from "@/components/ui/empty-or-error";
import { PinDialog } from "@/components/chipi/pin-dialog";
import { useMarketplace } from "@/hooks/use-marketplace";
import { ipfsToHttp, formatDisplayPrice, cn } from "@/lib/utils";
import { ExternalLink, HandCoins } from "lucide-react";
import { EXPLORER_URL } from "@/lib/constants";
import { formatDistanceToNow } from "date-fns";
import Image from "next/image";
import Link from "next/link";
import type { ApiOrder } from "@medialane/sdk";

interface OffersTableProps {
  address: string;
}

function formatExpiry(endTime: string | bigint) {
  const expiry = new Date(Number(endTime) * 1000);
  const now = new Date();
  if (expiry < now) return { label: "Expired", urgent: false, expired: true };
  const urgent = expiry.getTime() - now.getTime() < 86400000;
  return { label: formatDistanceToNow(expiry, { addSuffix: true }), urgent, expired: false };
}

function OfferRow({
  order,
  isProcessing,
  onCancel,
}: {
  order: ApiOrder;
  isProcessing: boolean;
  onCancel: (order: ApiOrder) => void;
}) {
  const name = order.token?.name || `#${order.nftTokenId}`;
  const image = order.token?.image ? ipfsToHttp(order.token.image) : null;
  const expiry = formatExpiry(order.endTime);

  return (
    <div className="flex items-center gap-4 px-4 py-3 hover:bg-muted/40 transition-colors">
      {/* Thumbnail */}
      <div className="relative h-12 w-12 rounded-lg overflow-hidden border border-border shrink-0 bg-gradient-to-br from-muted to-muted-foreground/20">
        {image && <Image src={image} alt={name} fill unoptimized sizes="48px" className="object-cover" />}
      </div>

      {/* Asset */}
      <div className="flex-1 min-w-0">
        <Link
          href={`/asset/${order.nftContract}/${order.nftTokenId}`}
          className="font-medium text-sm hover:text-primary transition-colors truncate block"
        >
          {name}
        </Link>
        <span className="text-xs text-muted-foreground">Offer</span>
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
          variant="outline"
          className="h-8 text-xs text-destructive hover:text-destructive"
          disabled={isProcessing}
          onClick={() => onCancel(order)}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}

export function OffersTable({ address }: OffersTableProps) {
  const { orders, isLoading, error, mutate } = useUserOrders(address);
  const { cancelOrder, isProcessing } = useMarketplace();
  const [pinOpen, setPinOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<ApiOrder | null>(null);

  const myOffers = orders.filter(
    (o) => o.offer.itemType === "ERC20" && o.status === "ACTIVE"
  );

  // Per-currency totals
  const currencyTotals = myOffers.reduce<Record<string, number>>((acc, o) => {
    const sym = o.price.currency ?? "?";
    acc[sym] = (acc[sym] ?? 0) + parseFloat(o.price.formatted ?? "0");
    return acc;
  }, {});
  const totalSummary = Object.entries(currencyTotals)
    .filter(([, v]) => v > 0)
    .map(([sym, v]) => `${v % 1 === 0 ? v : v.toFixed(4)} ${sym}`)
    .join(" · ");

  const handleCancel = (order: ApiOrder) => {
    setSelectedOrder(order);
    setPinOpen(true);
  };

  const handlePin = async (pin: string) => {
    setPinOpen(false);
    if (!selectedOrder) return;
    await cancelOrder({ orderHash: selectedOrder.orderHash, pin });
    mutate();
  };

  return (
    <>
      <EmptyOrError
        isLoading={isLoading}
        error={error}
        isEmpty={myOffers.length === 0}
        onRetry={mutate}
        emptyTitle="No offers sent yet"
        emptyDescription="Browse the marketplace to make offers on assets."
        emptyCta={{ label: "Browse marketplace", href: "/marketplace" }}
        emptyIcon={<HandCoins className="h-7 w-7 text-muted-foreground" />}
        skeletonCount={3}
      >
        <div className="space-y-1">
          {myOffers.length > 0 && (
            <p className="text-sm text-muted-foreground pb-2">
              {myOffers.length} active offer{myOffers.length !== 1 ? "s" : ""}
              {totalSummary ? ` · Total: ${totalSummary}` : ""}
            </p>
          )}
          <div className="rounded-lg border border-border overflow-hidden">
            {/* Column headers */}
            <div className="flex items-center gap-4 px-4 py-2 text-xs uppercase tracking-wide text-muted-foreground border-b border-border bg-muted/30">
              <div className="w-12 shrink-0" />
              <div className="flex-1">Asset</div>
              <div className="hidden sm:block w-24 text-right">Offer price</div>
              <div className="hidden md:block w-28">Expires</div>
              <div className="w-24 text-right">Actions</div>
            </div>
            {myOffers.map((order) => (
              <OfferRow
                key={order.orderHash}
                order={order}
                isProcessing={isProcessing}
                onCancel={handleCancel}
              />
            ))}
          </div>
        </div>
      </EmptyOrError>

      <PinDialog
        open={pinOpen}
        onSubmit={handlePin}
        onCancel={() => { setPinOpen(false); setSelectedOrder(null); }}
        title="Cancel offer"
        description={`Enter your PIN to cancel your offer on token #${selectedOrder?.nftTokenId}.`}
      />
    </>
  );
}
