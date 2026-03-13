"use client";

import { useState } from "react";
import { useUserOrders } from "@/hooks/use-orders";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyOrError } from "@/components/ui/empty-or-error";
import { PinDialog } from "@/components/chipi/pin-dialog";
import { useMarketplace } from "@/hooks/use-marketplace";
import { timeUntil, ipfsToHttp , formatDisplayPrice} from "@/lib/utils";
import { ExternalLink, Inbox } from "lucide-react";
import { EXPLORER_URL } from "@/lib/constants";
import Image from "next/image";
import Link from "next/link";
import type { ApiOrder } from "@medialane/sdk";

interface ReceivedOffersTableProps {
  address: string;
}

function ReceivedOfferRow({
  order,
  isProcessing,
  onAccept,
}: {
  order: ApiOrder;
  isProcessing: boolean;
  onAccept: (order: ApiOrder) => void;
}) {
  const name = order.token?.name || `#${order.nftTokenId}`;
  const image = order.token?.image ? ipfsToHttp(order.token.image) : null;

  return (
    <div className="flex items-center justify-between p-4 gap-4">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {image ? (
          <div className="relative h-10 w-10 rounded-lg overflow-hidden border border-border shrink-0 bg-muted">
            <Image src={image} alt={name} fill className="object-cover" />
          </div>
        ) : (
          <div className="h-10 w-10 rounded-lg border border-border shrink-0 bg-muted" />
        )}
        <div className="min-w-0">
          <Link
            href={`/asset/${order.nftContract}/${order.nftTokenId}`}
            className="font-semibold text-sm hover:underline truncate block"
          >
            {name}
          </Link>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-[10px]">Received offer</Badge>
            <p className="text-xs text-muted-foreground">
              Expires {timeUntil(order.endTime)}
            </p>
          </div>
        </div>
      </div>

      <div className="text-right shrink-0">
        <p className="font-bold text-sm">{formatDisplayPrice(order.price.formatted)} {order.price.currency}</p>
        <Link
          href={`/creator/${order.offerer}`}
          className="text-xs text-muted-foreground hover:text-primary transition-colors truncate max-w-[100px] block"
        >
          from {order.offerer.slice(0, 8)}…
        </Link>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <a
          href={`${EXPLORER_URL}/tx/${order.txHash.created}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <ExternalLink className="h-4 w-4 text-muted-foreground hover:text-foreground" />
        </a>
        <Button
          size="sm"
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

  // Received = ERC20 offers where someone else is the offerer
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
        <div className="divide-y divide-border rounded-lg border">
          {receivedOffers.map((order) => (
            <ReceivedOfferRow
              key={order.orderHash}
              order={order}
              isProcessing={isProcessing}
              onAccept={handleAccept}
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
