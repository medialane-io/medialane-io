"use client";

import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { PurchaseDialog } from "@/components/marketplace/purchase-dialog";
import { PinDialog } from "@/components/chipi/pin-dialog";
import { useCart } from "@/hooks/use-cart";
import { useMedialaneClient } from "@/hooks/use-medialane-client";
import { useMarketplace } from "@/hooks/use-marketplace";
import { ShoppingBag, X, ShoppingCart, AlertCircle, Loader2, CheckCircle2 } from "lucide-react";
import type { ApiOrder } from "@medialane/sdk";
import type { CartItem } from "@/types";
import { CurrencyIcon } from "@/components/shared/currency-icon";

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
      identifier: item.nftTokenId,
      startAmount: "1",
      endAmount: "1",
    },
    consideration: {
      itemType: "ERC20",
      token: item.considerationToken,
      identifier: "0",
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
    startTime: new Date().toISOString(),
    endTime: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    salt: "0",
    nonce: "0",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  } as unknown as ApiOrder;
}

interface BatchProgress {
  total: number;
  current: number;
  done: number;
  failed: string[]; // orderHashes that failed
}

export function CartDrawer() {
  const { items, isOpen, setIsOpen, removeItem } = useCart();
  const client = useMedialaneClient();
  const { fulfillOrder } = useMarketplace();
  const [purchaseOrder, setPurchaseOrder] = useState<ApiOrder | null>(null);
  const [purchaseOpen, setPurchaseOpen] = useState(false);
  const [staleHashes, setStaleHashes] = useState<Set<string>>(new Set());
  const [validating, setValidating] = useState(false);
  const [batchPinOpen, setBatchPinOpen] = useState(false);
  const [batchProgress, setBatchProgress] = useState<BatchProgress | null>(null);

  // Validate cart items whenever the drawer opens — remove fulfilled/expired orders
  useEffect(() => {
    if (!isOpen || items.length === 0) return;

    let cancelled = false;
    setValidating(true);

    Promise.allSettled(
      items.map((item) =>
        client.api.getOrder(item.orderHash).then((res) => ({
          orderHash: item.orderHash,
          status: res.data?.status,
        }))
      )
    ).then((results) => {
      if (cancelled) return;
      const stale = new Set<string>();
      for (const r of results) {
        if (r.status === "fulfilled" && r.value.status !== "ACTIVE") {
          stale.add(r.value.orderHash);
        }
      }
      setStaleHashes(stale);
      setValidating(false);
    });

    return () => { cancelled = true; };
  // Intentionally depend only on `isOpen` — including `items` would re-check
  // availability on every cart mutation rather than once on open. `client` is a
  // stable singleton and safe to omit.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleBuy = (item: CartItem) => {
    setPurchaseOrder(cartItemToOrder(item));
    setPurchaseOpen(true);
  };

  const handleRemoveStale = (orderHash: string) => {
    removeItem(orderHash);
    setStaleHashes((prev) => { const s = new Set(prev); s.delete(orderHash); return s; });
  };

  const validItems = items.filter((i) => !staleHashes.has(i.orderHash));

  const handleBatchCheckout = async (pin: string) => {
    setBatchPinOpen(false);
    if (validItems.length === 0) return;

    setBatchProgress({ total: validItems.length, current: 0, done: 0, failed: [] });

    const failed: string[] = [];
    for (let i = 0; i < validItems.length; i++) {
      const item = validItems[i];
      setBatchProgress((p) => p ? { ...p, current: i + 1 } : p);
      try {
        await fulfillOrder({ orderHash: item.orderHash, pin });
        removeItem(item.orderHash);
        setBatchProgress((p) => p ? { ...p, done: p.done + 1 } : p);
      } catch {
        failed.push(item.orderHash);
        setBatchProgress((p) => p ? { ...p, failed: [...p.failed, item.orderHash] } : p);
      }
    }

    setBatchProgress((p) => p ? { ...p, failed } : p);
    // Auto-dismiss after 3s if all succeeded
    if (failed.length === 0) {
      setTimeout(() => setBatchProgress(null), 3000);
    }
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
            <div className="flex flex-col h-full">
              {/* Batch progress overlay */}
              {batchProgress && (
                <div className="mx-4 mt-4 rounded-lg border bg-muted/30 p-4 space-y-3">
                  {batchProgress.current <= batchProgress.total && batchProgress.done + batchProgress.failed.length < batchProgress.total ? (
                    <div className="flex items-center gap-2 text-sm">
                      <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                      <span>Buying {batchProgress.current} of {batchProgress.total}…</span>
                    </div>
                  ) : (
                    <div className="space-y-1.5 text-sm">
                      {batchProgress.done > 0 && (
                        <div className="flex items-center gap-2 text-emerald-500">
                          <CheckCircle2 className="h-4 w-4 shrink-0" />
                          <span>{batchProgress.done} item{batchProgress.done !== 1 ? "s" : ""} purchased!</span>
                        </div>
                      )}
                      {batchProgress.failed.length > 0 && (
                        <div className="flex items-center gap-2 text-destructive">
                          <AlertCircle className="h-4 w-4 shrink-0" />
                          <span>{batchProgress.failed.length} item{batchProgress.failed.length !== 1 ? "s" : ""} failed.</span>
                        </div>
                      )}
                      <button
                        className="text-xs text-muted-foreground underline underline-offset-2 hover:no-underline"
                        onClick={() => setBatchProgress(null)}
                      >
                        Dismiss
                      </button>
                    </div>
                  )}
                </div>
              )}

              <div className="flex flex-col gap-3 px-4 py-4 overflow-y-auto flex-1">
                {validating && (
                  <p className="text-xs text-muted-foreground text-center py-1">Checking availability…</p>
                )}
                {items.map((item) => {
                  const isStale = staleHashes.has(item.orderHash);
                  return (
                    <div
                      key={item.orderHash}
                      className={`flex flex-col gap-2 rounded-lg border p-3 transition-colors ${
                        isStale ? "border-destructive/40 bg-destructive/5" : "border-border"
                      }`}
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
                          onClick={() => isStale ? handleRemoveStale(item.orderHash) : removeItem(item.orderHash)}
                          aria-label="Remove from cart"
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>

                      {isStale ? (
                        <div className="flex items-center gap-1.5 text-xs text-destructive">
                          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                          <span>No longer available</span>
                          <button
                            className="ml-auto underline underline-offset-2 hover:no-underline"
                            onClick={() => handleRemoveStale(item.orderHash)}
                          >
                            Remove
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-bold flex items-center gap-1">
                            <CurrencyIcon symbol={item.currency} size={13} />
                            {item.price} {item.currency}
                          </p>
                          <Button
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => handleBuy(item)}
                            disabled={!!batchProgress}
                          >
                            <ShoppingCart className="h-3 w-3 mr-1" />
                            Buy
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Batch checkout footer */}
              {validItems.length > 1 && (
                <div className="px-4 pb-4 pt-2 border-t border-border">
                  <Button
                    className="w-full"
                    disabled={!!batchProgress}
                    onClick={() => setBatchPinOpen(true)}
                  >
                    <ShoppingBag className="h-4 w-4 mr-2" />
                    Buy all {validItems.length} items
                  </Button>
                  <p className="text-[10px] text-center text-muted-foreground mt-2">
                    Enter your PIN once to purchase sequentially.
                  </p>
                </div>
              )}
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

      <PinDialog
        open={batchPinOpen}
        onSubmit={handleBatchCheckout}
        onCancel={() => setBatchPinOpen(false)}
        title="Buy all items"
        description={`Enter your PIN to purchase ${validItems.length} items sequentially.`}
      />
    </>
  );
}
