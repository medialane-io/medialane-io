"use client";

import { useState } from "react";
import Link from "next/link";
import { useOrders } from "@/hooks/use-orders";
import { ipfsToHttp, formatDisplayPrice } from "@/lib/utils";
import { CurrencyIcon } from "@/components/shared/currency-icon";
import type { ApiOrder } from "@medialane/sdk";

// ── Single pill ──────────────────────────────────────────────────────────────
function ActivityPill({ listing }: { listing: ApiOrder }) {
  const [imgError, setImgError] = useState(false);
  const image = listing.token?.image && !imgError ? ipfsToHttp(listing.token.image) : null;

  return (
    <Link
      href={`/asset/${listing.nftContract}/${listing.nftTokenId}`}
      className="flex-shrink-0 flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 hover:bg-muted/60 active:scale-[0.98] transition-all duration-150 group"
    >
      <div className="h-8 w-8 rounded-lg overflow-hidden bg-muted shrink-0">
        {image ? (
          <img
            src={image}
            alt=""
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-brand-purple/20 to-brand-blue/20" />
        )}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium whitespace-nowrap max-w-[100px] truncate">
          {listing.token?.name ?? `#${listing.nftTokenId}`}
        </p>
        {listing.price && (
          <p className="text-[10px] font-bold text-brand-orange whitespace-nowrap flex items-center gap-0.5">
            <CurrencyIcon symbol={listing.price.currency} size={10} />
            {formatDisplayPrice(listing.price.formatted)} {listing.price.currency}
          </p>
        )}
      </div>
    </Link>
  );
}

// ── Ticker strip ─────────────────────────────────────────────────────────────

interface ActivityTickerProps {
  /** Minimum number of items needed to show the ticker. Default 3. */
  minItems?: number;
  /** How many orders to fetch. Default 12. */
  limit?: number;
  /** Optional label shown above/beside the ticker. */
  label?: React.ReactNode;
  /** Extra classes on the outer wrapper. */
  className?: string;
}

export function ActivityTicker({
  minItems = 3,
  limit = 12,
  label,
  className,
}: ActivityTickerProps) {
  const { orders } = useOrders({ status: "ACTIVE", sort: "recent", limit });

  if (orders.length < minItems) return null;

  return (
    <div className={className}>
      {label && <div className="mb-2">{label}</div>}
      <div className="relative overflow-hidden py-2.5">
        <div
          className="flex gap-2 w-max px-2"
          style={{ animation: "scroll-strip 50s linear infinite" }}
          onMouseEnter={(e) => (e.currentTarget.style.animationPlayState = "paused")}
          onMouseLeave={(e) => (e.currentTarget.style.animationPlayState = "running")}
        >
          {[...orders, ...orders].map((listing, i) => (
            <ActivityPill key={`${listing.orderHash}-${i}`} listing={listing} />
          ))}
        </div>
      </div>
    </div>
  );
}
