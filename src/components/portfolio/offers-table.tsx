"use client";

import { useState } from "react";
import { useUserOrders } from "@/hooks/use-orders";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PinDialog } from "@/components/chipi/pin-dialog";
import { useMarketplace } from "@/hooks/use-marketplace";
import { timeUntil, ipfsToHttp , formatDisplayPrice} from "@/lib/utils";
import { ExternalLink } from "lucide-react";
import { EXPLORER_URL } from "@/lib/constants";
import Image from "next/image";
import Link from "next/link";
import type { ApiOrder } from "@medialane/sdk";

interface OffersTableProps {
  address: string;
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
            <Badge variant="secondary" className="text-[10px]">Offer</Badge>
            <p className="text-xs text-muted-foreground">
              Expires {timeUntil(order.endTime)}
            </p>
          </div>
        </div>
      </div>

      <div className="text-right shrink-0">
        <p className="font-bold text-sm">{formatDisplayPrice(order.price.formatted)} {order.price.currency}</p>
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
          variant="destructive"
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
  const { orders, isLoading, mutate } = useUserOrders(address);
  const { cancelOrder, isProcessing } = useMarketplace();
  const [pinOpen, setPinOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<ApiOrder | null>(null);

  const myOffers = orders.filter(
    (o) => o.offer.itemType === "ERC20" && o.status === "ACTIVE"
  );

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

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (myOffers.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="font-semibold">No active offers</p>
        <p className="text-sm text-muted-foreground mt-1">
          Browse the marketplace to make offers on assets.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="divide-y divide-border rounded-lg border">
        {myOffers.map((order) => (
          <OfferRow
            key={order.orderHash}
            order={order}
            isProcessing={isProcessing}
            onCancel={handleCancel}
          />
        ))}
      </div>

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
