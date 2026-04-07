"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PurchaseDialog } from "@/components/marketplace/purchase-dialog";
import { PinDialog } from "@/components/chipi/pin-dialog";
import { useCart } from "@/hooks/use-cart";
import { useMedialaneClient } from "@/hooks/use-medialane-client";
import { useMarketplace } from "@/hooks/use-marketplace";
import { ipfsToHttp } from "@/lib/utils";
import {
  ShoppingBag, X, ShoppingCart, AlertCircle, Loader2,
  CheckCircle2, ArrowRight,
} from "lucide-react";
import type { ApiOrder } from "@medialane/sdk";
import type { CartItem } from "@/types";
import { CurrencyIcon } from "@/components/shared/currency-icon";

// ─── helpers ────────────────────────────────────────────────────────────────

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
  failed: string[];
}

// ─── CartItemRow ─────────────────────────────────────────────────────────────

function CartItemRow({
  item,
  isStale,
  batchActive,
  onBuy,
  onRemove,
}: {
  item: CartItem;
  isStale: boolean;
  batchActive: boolean;
  onBuy: (item: CartItem) => void;
  onRemove: (orderHash: string) => void;
}) {
  const [imgError, setImgError] = useState(false);
  const imageUrl = ipfsToHttp(item.image);

  return (
    <div
      className={`flex items-center gap-3 rounded-xl border p-3 transition-colors ${
        isStale ? "border-destructive/40 bg-destructive/5" : "border-border/60 bg-card/40"
      }`}
    >
      {/* Thumbnail */}
      <div className="relative h-16 w-16 rounded-lg overflow-hidden shrink-0 bg-muted">
        {imageUrl && !imgError ? (
          <Image
            src={imageUrl}
            alt={item.name}
            fill
            unoptimized
            className="object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-brand-purple/20 to-brand-blue/20">
            <span className="text-xs font-mono text-muted-foreground">#{item.nftTokenId}</span>
          </div>
        )}
        {isStale && (
          <div className="absolute inset-0 bg-destructive/30 flex items-center justify-center">
            <AlertCircle className="h-4 w-4 text-white" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate leading-tight">{item.name || `Token #${item.nftTokenId}`}</p>
        {isStale ? (
          <p className="text-xs text-destructive mt-0.5 font-medium">No longer available</p>
        ) : (
          <p className="flex items-center gap-1 mt-1">
            <CurrencyIcon symbol={item.currency} size={12} />
            <span className="text-sm font-bold">{item.price}</span>
            <span className="text-xs text-muted-foreground">{item.currency}</span>
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5 shrink-0">
        {!isStale && (
          <button
            className="h-8 px-3 rounded-[11px] bg-brand-blue text-white text-xs font-semibold flex items-center gap-1 hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50"
            onClick={() => onBuy(item)}
            disabled={batchActive}
          >
            <ShoppingCart className="h-3.5 w-3.5" />
            Buy
          </button>
        )}
        <button
          className="h-8 w-8 rounded-[11px] flex items-center justify-center text-muted-foreground/60 hover:text-foreground hover:bg-muted/60 transition-colors"
          onClick={() => onRemove(item.orderHash)}
          aria-label="Remove from cart"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

// ─── CartDrawer ───────────────────────────────────────────────────────────────

export function CartDrawer() {
  const { items, isOpen, setIsOpen, removeItem, clearCart } = useCart();
  const client = useMedialaneClient();
  const { fulfillOrder } = useMarketplace();

  const [purchaseOrder, setPurchaseOrder] = useState<ApiOrder | null>(null);
  const [purchaseOpen, setPurchaseOpen] = useState(false);
  const [staleHashes, setStaleHashes] = useState<Set<string>>(new Set());
  const [validating, setValidating] = useState(false);
  const [batchPinOpen, setBatchPinOpen] = useState(false);
  const [batchProgress, setBatchProgress] = useState<BatchProgress | null>(null);

  // Validate on open
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleBuy = (item: CartItem) => {
    setPurchaseOrder(cartItemToOrder(item));
    setPurchaseOpen(true);
  };

  const handleRemove = (orderHash: string) => {
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
    if (failed.length === 0) setTimeout(() => setBatchProgress(null), 3000);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="w-full max-w-sm sm:max-w-md p-0 overflow-hidden gap-0 flex flex-col max-h-[90svh]">

          {/* ── Header ── pr-10 leaves room for the Dialog's built-in close button ── */}
          <div className="flex items-center justify-between pr-10 pl-5 py-4 border-b border-border/60">
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              <ShoppingBag className="h-5 w-5 text-brand-blue" />
              Cart
              {items.length > 0 && (
                <span className="text-sm font-normal text-muted-foreground">
                  ({items.length} item{items.length !== 1 ? "s" : ""})
                </span>
              )}
            </DialogTitle>
            {items.length > 0 && !batchProgress && (
              <button
                className="text-[11px] text-muted-foreground hover:text-foreground underline-offset-2 hover:underline transition-colors"
                onClick={clearCart}
              >
                Clear all
              </button>
            )}
          </div>

          {/* ── Empty state ────────────────────────────────────── */}
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 py-16 px-6 text-center">
              <div className="h-16 w-16 rounded-2xl bg-muted/60 flex items-center justify-center">
                <ShoppingCart className="h-8 w-8 text-muted-foreground/30" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold">Your cart is empty</p>
                <p className="text-xs text-muted-foreground">Add items from the marketplace to get started</p>
              </div>
              <button
                className="h-9 px-4 rounded-[11px] bg-brand-blue text-white text-xs font-semibold flex items-center gap-1.5 hover:brightness-110 transition-all"
                onClick={() => setIsOpen(false)}
              >
                Browse marketplace <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <>
              {/* ── Batch progress ─────────────────────────────── */}
              {batchProgress && (
                <div className="mx-5 mt-4 rounded-xl border bg-muted/30 p-3.5 space-y-2">
                  {batchProgress.done + batchProgress.failed.length < batchProgress.total ? (
                    <div className="flex items-center gap-2 text-sm">
                      <Loader2 className="h-4 w-4 animate-spin shrink-0 text-brand-blue" />
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
                          <span>{batchProgress.failed.length} failed.</span>
                        </div>
                      )}
                      <button
                        className="text-xs text-muted-foreground underline underline-offset-2"
                        onClick={() => setBatchProgress(null)}
                      >
                        Dismiss
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* ── Item list ──────────────────────────────────── */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-2.5">
                {validating && (
                  <p className="text-xs text-muted-foreground text-center pb-1 flex items-center justify-center gap-1.5">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Checking availability…
                  </p>
                )}
                {items.map((item) => (
                  <CartItemRow
                    key={item.orderHash}
                    item={item}
                    isStale={staleHashes.has(item.orderHash)}
                    batchActive={!!batchProgress}
                    onBuy={handleBuy}
                    onRemove={handleRemove}
                  />
                ))}
              </div>

              {/* ── Footer ─────────────────────────────────────── */}
              <div className="px-5 pt-3 pb-5 border-t border-border/60 space-y-3">
                {/* Buy all */}
                {validItems.length > 1 && (
                  <button
                    className="w-full h-11 rounded-[11px] bg-brand-purple text-white text-sm font-semibold flex items-center justify-center gap-2 hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50"
                    disabled={!!batchProgress}
                    onClick={() => setBatchPinOpen(true)}
                  >
                    <ShoppingBag className="h-4 w-4" />
                    Buy all {validItems.length} items
                  </button>
                )}
                {validItems.length === 1 && (
                  <button
                    className="w-full h-11 rounded-[11px] bg-brand-blue text-white text-sm font-semibold flex items-center justify-center gap-2 hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50"
                    disabled={!!batchProgress}
                    onClick={() => handleBuy(validItems[0])}
                  >
                    <ShoppingCart className="h-4 w-4" />
                    Buy now
                  </button>
                )}
                <p className="text-[10px] text-center text-muted-foreground">
                  Gas is free · PIN authorises each purchase · Starknet
                </p>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

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
