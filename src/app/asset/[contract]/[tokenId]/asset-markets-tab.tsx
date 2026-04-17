"use client";

import { Button } from "@/components/ui/button";
import { AddressDisplay } from "@/components/shared/address-display";
import { CurrencyIcon } from "@/components/shared/currency-icon";
import { formatDisplayPrice, timeUntil } from "@/lib/utils";
import { Clock, CheckCircle } from "lucide-react";
import type { ApiOrder } from "@medialane/sdk";

interface AssetMarketsTabProps {
  activeListings: ApiOrder[];
  activeBids: ApiOrder[];
  walletAddress?: string;
  isOwner: boolean;
  isProcessing: boolean;
  onBuyClick: (order: ApiOrder) => void;
  onCancelClick: (order: ApiOrder) => void;
  onAcceptClick: (order: ApiOrder) => void;
}

export function AssetMarketsTab({
  activeListings,
  activeBids,
  walletAddress,
  isOwner,
  isProcessing,
  onBuyClick,
  onCancelClick,
  onAcceptClick,
}: AssetMarketsTabProps) {
  return (
    <div className="mt-4 space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Listings</p>
        {activeListings.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">No active listings.</p>
        ) : (
          <div className="rounded-xl border border-border divide-y divide-border">
            {activeListings.map((order) => {
              const isMyOrder = walletAddress && order.offerer.toLowerCase() === walletAddress.toLowerCase();
              return (
                <div key={order.orderHash} className="flex items-center justify-between px-4 py-3 gap-4">
                  <div className="min-w-0">
                    <p className="font-bold text-sm inline-flex items-center gap-1.5">
                      {formatDisplayPrice(order.price.formatted)}
                      <CurrencyIcon symbol={order.price.currency ?? ""} size={14} />
                    </p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                      <Clock className="h-3 w-3" />
                      {timeUntil(order.endTime)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <AddressDisplay address={order.offerer} chars={4} showCopy={false} className="text-xs text-muted-foreground" />
                    {isMyOrder ? (
                      <Button size="sm" variant="destructive" disabled={isProcessing} onClick={() => onCancelClick(order)}>
                        Cancel
                      </Button>
                    ) : (
                      <Button size="sm" onClick={() => onBuyClick(order)}>Buy</Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Offers</p>
        {activeBids.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">No active offers.</p>
        ) : (
          <div className="rounded-xl border border-border divide-y divide-border">
            {activeBids.map((bid) => (
              <div key={bid.orderHash} className="flex items-center justify-between px-4 py-3 gap-4">
                <div className="min-w-0">
                  <p className="font-bold text-sm">
                    <span className="inline-flex items-center gap-1.5">
                      {formatDisplayPrice(bid.price.formatted)}
                      <CurrencyIcon symbol={bid.price.currency ?? ""} size={14} />
                    </span>
                  </p>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                    <Clock className="h-3 w-3" />
                    {timeUntil(bid.endTime)}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <AddressDisplay address={bid.offerer} chars={4} showCopy={false} className="text-xs text-muted-foreground" />
                  {isOwner && (
                    <Button size="sm" disabled={isProcessing} onClick={() => onAcceptClick(bid)}>
                      <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
                      Accept
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
