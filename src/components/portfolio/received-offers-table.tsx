"use client";

import { useState } from "react";
import { useUserOrders } from "@/hooks/use-orders";
import { useToken } from "@/hooks/use-tokens";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PinDialog } from "@/components/chipi/pin-dialog";
import { useMarketplace } from "@/hooks/use-marketplace";
import { timeUntil, ipfsToHttp } from "@/lib/utils";
import { ExternalLink } from "lucide-react";
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
  const { token } = useToken(order.nftContract, order.nftTokenId);
  const name = token?.metadata?.name || `#${order.nftTokenId}`;
  const image = token?.metadata?.image ? ipfsToHttp(token.metadata.image) : null;

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
        <p className="font-bold text-sm">{order.price.formatted} {order.price.currency}</p>
        <p className="text-xs text-muted-foreground truncate max-w-[100px]">
          from {order.offerer.slice(0, 8)}…
        </p>
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
  const { orders, isLoading, mutate } = useUserOrders(address);
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

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (receivedOffers.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="font-semibold">No incoming offers</p>
        <p className="text-sm text-muted-foreground mt-1">
          Offers made on your assets will appear here.
        </p>
      </div>
    );
  }

  return (
    <>
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

      <PinDialog
        open={pinOpen}
        onSubmit={handlePin}
        onCancel={() => { setPinOpen(false); setSelectedOrder(null); }}
        title="Accept offer"
        description={selectedOrder
          ? `Accept ${selectedOrder.price.formatted} ${selectedOrder.price.currency} for token #${selectedOrder.nftTokenId}?`
          : "Enter your PIN to accept this offer."}
      />
    </>
  );
}
