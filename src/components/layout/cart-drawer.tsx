"use client";

import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { PurchaseDialog } from "@/components/marketplace/purchase-dialog";
import { useCart } from "@/hooks/use-cart";
import { ShoppingBag, X, ShoppingCart } from "lucide-react";
import type { ApiOrder } from "@medialane/sdk";
import type { CartItem } from "@/types";

function cartItemToOrder(item: CartItem): ApiOrder {
  return {
    orderHash: item.orderHash,
    nftContract: item.nftContract,
    nftTokenId: item.nftTokenId,
    offerer: item.offerer,
    status: "ACTIVE",
    offer: {
      itemType: "ERC721",
      token: item.nftContract,
      identifierOrCriteria: item.nftTokenId,
      startAmount: "1",
      endAmount: "1",
    },
    consideration: {
      itemType: "ERC20",
      token: item.considerationToken,
      identifierOrCriteria: "0",
      startAmount: item.considerationAmount,
      endAmount: item.considerationAmount,
      recipient: item.offerer,
    },
    price: {
      formatted: item.price,
      currency: item.currency,
      decimals: item.currencyDecimals,
      raw: item.considerationAmount,
    },
    startTime: 0,
    endTime: 0,
    salt: "0",
    nonce: "0",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  } as unknown as ApiOrder;
}

export function CartDrawer() {
  const { items, isOpen, setIsOpen, removeItem } = useCart();
  const [purchaseOrder, setPurchaseOrder] = useState<ApiOrder | null>(null);
  const [purchaseOpen, setPurchaseOpen] = useState(false);

  const handleBuy = (item: CartItem) => {
    setPurchaseOrder(cartItemToOrder(item));
    setPurchaseOpen(true);
  };

  return (
    <>
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5" />
              Cart
              {items.length > 0 && (
                <span className="ml-1 text-sm font-normal text-muted-foreground">
                  ({items.length} item{items.length !== 1 ? "s" : ""})
                </span>
              )}
            </SheetTitle>
          </SheetHeader>

          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center flex-1 gap-3 text-center px-4 py-16">
              <ShoppingCart className="h-12 w-12 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">Your cart is empty</p>
              <Button variant="outline" size="sm" onClick={() => setIsOpen(false)} asChild>
                <a href="/marketplace">Browse marketplace</a>
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-3 px-4 py-4 overflow-y-auto">
              {items.map((item) => (
                <div
                  key={item.orderHash}
                  className="flex flex-col gap-2 rounded-lg border border-border p-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{item.name || `Token #${item.nftTokenId}`}</p>
                      <p className="text-xs text-muted-foreground font-mono truncate">#{item.nftTokenId}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 shrink-0 text-muted-foreground hover:text-foreground"
                      onClick={() => removeItem(item.orderHash)}
                      aria-label="Remove from cart"
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-bold">
                      {item.price} {item.currency}
                    </p>
                    <Button
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => handleBuy(item)}
                    >
                      <ShoppingCart className="h-3 w-3 mr-1" />
                      Buy
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SheetContent>
      </Sheet>

      {purchaseOrder && (
        <PurchaseDialog
          order={purchaseOrder}
          open={purchaseOpen}
          onOpenChange={(v) => {
            setPurchaseOpen(v);
            if (!v) setPurchaseOrder(null);
          }}
        />
      )}
    </>
  );
}
