"use client";

import { useState } from "react";
import { ShoppingCart, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/use-cart";
import { useCollectionFloorListings } from "@/hooks/use-orders";
import { useSessionKey } from "@/hooks/use-session-key";
import { toast } from "sonner";
import type { ApiOrder } from "@medialane/sdk";

interface SweepBarProps {
  contract: string;
}

function orderToCartItem(order: ApiOrder) {
  return {
    orderHash: order.orderHash,
    nftContract: order.nftContract ?? "",
    nftTokenId: order.nftTokenId ?? "",
    name: order.token?.name ?? `Token #${order.nftTokenId}`,
    image: order.token?.image ?? "",
    price: order.price?.formatted ?? "0",
    currency: order.price?.currency ?? "STRK",
    currencyDecimals: order.price?.decimals ?? 18,
    offerer: order.offerer,
    considerationToken: order.consideration.token ?? "",
    considerationAmount: order.consideration.startAmount ?? "",
  };
}

export function SweepBar({ contract }: SweepBarProps) {
  const [count, setCount] = useState(1);
  const { listings, isLoading } = useCollectionFloorListings(contract, 20);
  const { addItem, items } = useCart();
  const { walletAddress } = useSessionKey();

  // Only show buyable listings (not owned by user)
  const buyable = listings.filter(
    (l) =>
      !walletAddress ||
      l.offerer.toLowerCase() !== walletAddress.toLowerCase()
  );

  const maxSweep = Math.min(buyable.length, 20);

  if (!isLoading && buyable.length === 0) return null;

  function handleSweep() {
    const toAdd = buyable.slice(0, count);
    let added = 0;
    for (const order of toAdd) {
      const alreadyInCart = items.some((i) => i.orderHash === order.orderHash);
      if (!alreadyInCart) {
        addItem(orderToCartItem(order), walletAddress ?? undefined);
        added++;
      }
    }
    if (added === 0) {
      toast.info("All selected listings are already in your cart");
    } else {
      toast.success(`Added ${added} listing${added > 1 ? "s" : ""} to cart`);
    }
  }

  const totalPrice = buyable
    .slice(0, count)
    .reduce((sum, l) => sum + parseFloat((l.price?.formatted ?? "0").replace(/[^0-9.]/g, "") || "0"), 0);

  const currency = buyable[0]?.price?.currency ?? "STRK";

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card/50">
      <span className="text-sm font-medium text-muted-foreground shrink-0">Sweep</span>

      {/* Count stepper */}
      <div className="flex items-center gap-1">
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7"
          onClick={() => setCount((c) => Math.max(1, c - 1))}
          disabled={count <= 1}
        >
          <Minus className="h-3 w-3" />
        </Button>
        <span className="text-sm font-semibold tabular-nums w-6 text-center">{count}</span>
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7"
          onClick={() => setCount((c) => Math.min(maxSweep, c + 1))}
          disabled={count >= maxSweep}
        >
          <Plus className="h-3 w-3" />
        </Button>
      </div>

      {/* Total price */}
      {totalPrice > 0 && (
        <span className="text-sm text-muted-foreground">
          ≈ <span className="font-semibold text-foreground">{totalPrice.toFixed(2)}</span>{" "}
          {currency}
        </span>
      )}

      <div className="flex-1" />

      <Button
        size="sm"
        onClick={handleSweep}
        disabled={isLoading || buyable.length === 0}
        className="gap-2 shrink-0"
      >
        <ShoppingCart className="h-3.5 w-3.5" />
        Add to cart
      </Button>
    </div>
  );
}
