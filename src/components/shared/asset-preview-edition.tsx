"use client";

import { useState } from "react";
import {
  ShoppingCart, HandCoins, Check, Flag, ArrowUpRight,
  UserCircle2, Layers, Zap, Minus, Plus,
} from "lucide-react";
import { CurrencyIcon } from "@/components/shared/currency-icon";
import { PurchaseDialog } from "@/components/marketplace/purchase-dialog";
import { OfferDialog } from "@/components/marketplace/offer-dialog";
import { ReportDialog } from "@/components/report-dialog";
import { ipfsToHttp, formatDisplayPrice } from "@/lib/utils";
import { useCart } from "@/hooks/use-cart";
import { toast } from "sonner";
import {
  PreviewHero, PreviewFooter, PreviewActionList,
  type AssetPreviewContentProps, type PreviewAction,
} from "./asset-preview-dialog";

export function AssetPreviewEdition({ token, isOwner, onClose }: AssetPreviewContentProps) {
  const { addItem, items } = useCart();
  const [imgError, setImgError] = useState(false);
  const [qty, setQty] = useState(1);
  const [buyOpen, setBuyOpen] = useState(false);
  const [offerOpen, setOfferOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  const name = token.metadata?.name || `Token #${token.tokenId}`;
  const image = imgError ? null : (ipfsToHttp(token.metadata?.image) ?? null);
  const activeOrder = token.activeOrders?.[0] ?? null;
  const inCart = activeOrder ? items.some((i) => i.orderHash === activeOrder.orderHash) : false;

  const assetHref = `/asset/${token.contractAddress}/${token.tokenId}`;
  const collectionHref = `/collections/${token.contractAddress}`;
  const currentOwner = token.balances?.[0]?.owner ?? token.owner ?? null;
  const ownerHref = currentOwner ? `/account/${currentOwner}` : null;

  // suppress unused warning — imgError is set via onError on the img tag inside PreviewHero
  void imgError;

  const handleAddToCart = () => {
    if (!activeOrder || inCart) return;
    addItem({
      orderHash: activeOrder.orderHash,
      nftContract: token.contractAddress,
      nftTokenId: token.tokenId,
      itemType: "ERC1155",
      name,
      image: image ?? "",
      price: formatDisplayPrice(activeOrder.price.formatted),
      currency: activeOrder.price.currency ?? "",
      currencyDecimals: activeOrder.price.decimals,
      offerer: activeOrder.offerer ?? "",
      considerationToken: activeOrder.consideration.token ?? "",
      considerationAmount: activeOrder.consideration.startAmount ?? "",
    });
    toast.success("Added to cart", { description: name });
  };

  const secondaryActions: PreviewAction[] = [];

  if (!isOwner && activeOrder) {
    secondaryActions.push({
      icon: inCart ? <Check className="h-4 w-4" /> : <ShoppingCart className="h-4 w-4" />,
      label: inCart ? "In cart" : "Add to cart",
      onClick: handleAddToCart,
      disabled: inCart,
    });
  }

  if (!isOwner) {
    secondaryActions.push({
      icon: <HandCoins className="h-4 w-4" />,
      label: "Make an offer",
      onClick: () => setOfferOpen(true),
      className: "text-brand-orange",
    });
  }

  secondaryActions.push(
    { icon: <ArrowUpRight className="h-4 w-4" />, label: "View details", href: assetHref, onClick: onClose },
    { icon: <Layers className="h-4 w-4" />, label: "View collection", href: collectionHref, onClick: onClose },
  );

  if (ownerHref) {
    secondaryActions.push({ icon: <UserCircle2 className="h-4 w-4" />, label: "View owner", href: ownerHref, onClick: onClose });
  }

  secondaryActions.push({
    icon: <Flag className="h-4 w-4" />,
    label: "Report",
    onClick: () => setReportOpen(true),
    className: "text-muted-foreground/60",
  });

  return (
    <>
      <PreviewHero
        image={image}
        name={name}
        ipType={token.metadata?.ipType}
        accentOverlay={
          <span className="absolute top-3 right-3 inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border border-violet-500/40 bg-violet-500/20 text-violet-300 backdrop-blur-sm">
            <Layers className="h-3 w-3" />
            Multi-edition
          </span>
        }
      />

      {/* Name + price */}
      <div className="flex items-start justify-between px-5 pt-4 pb-1 shrink-0">
        <div className="min-w-0 flex-1 mr-3">
          <p className="font-bold text-lg leading-tight line-clamp-2">{name}</p>
          {token.metadata?.ipType && (
            <p className="text-xs text-muted-foreground mt-0.5">{token.metadata.ipType}</p>
          )}
        </div>
        {activeOrder?.price?.formatted && (
          <div className="shrink-0 text-right">
            <p className="font-bold text-xl leading-tight flex items-center gap-1">
              <CurrencyIcon symbol={activeOrder.price.currency ?? ""} size={14} />
              {formatDisplayPrice(activeOrder.price.formatted)}
            </p>
            <p className="text-xs text-muted-foreground">per edition</p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="px-5 pb-2 pt-3 space-y-3 flex-1 overflow-y-auto">
        {!isOwner && activeOrder && (
          <>
            {/* Quantity stepper */}
            <div className="flex items-center justify-between px-1">
              <span className="text-sm text-muted-foreground">Quantity</span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="h-8 w-8 rounded-lg border border-border flex items-center justify-center hover:bg-muted transition-colors disabled:opacity-40"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  disabled={qty <= 1}
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <span className="w-6 text-center font-semibold text-sm">{qty}</span>
                <button
                  type="button"
                  className="h-8 w-8 rounded-lg border border-border flex items-center justify-center hover:bg-muted transition-colors"
                  onClick={() => setQty((q) => q + 1)}
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Buy CTA */}
            <div className="btn-border-animated p-[1px] rounded-xl">
              <button
                type="button"
                className="w-full h-11 rounded-[11px] flex items-center justify-center gap-2 text-sm font-semibold text-white transition-all hover:brightness-110 active:scale-[0.98] bg-background/30"
                onClick={() => setBuyOpen(true)}
              >
                <Zap className="h-4 w-4" />
                Buy {qty > 1 ? `${qty} editions` : "now"}
                {activeOrder.price?.formatted && (
                  <span className="flex items-center gap-0.5 ml-1 text-white/80 text-xs font-normal">
                    <CurrencyIcon symbol={activeOrder.price.currency ?? ""} size={11} />
                    {(parseFloat(activeOrder.price.formatted) * qty).toFixed(2)}
                    <span className="ml-0.5">{activeOrder.price.currency}</span>
                  </span>
                )}
              </button>
            </div>
          </>
        )}

        <div className="pt-1">
          <PreviewActionList actions={secondaryActions} />
        </div>
      </div>

      <PreviewFooter />

      {activeOrder && (
        <PurchaseDialog
          order={activeOrder}
          open={buyOpen}
          onOpenChange={setBuyOpen}
          onSuccess={() => { setBuyOpen(false); onClose(); }}
        />
      )}
      <OfferDialog
        open={offerOpen}
        onOpenChange={setOfferOpen}
        assetContract={token.contractAddress}
        tokenId={token.tokenId}
        tokenName={name}
        tokenImage={image ?? undefined}
      />
      <ReportDialog
        target={{ type: "TOKEN", contract: token.contractAddress, tokenId: token.tokenId, name }}
        open={reportOpen}
        onOpenChange={setReportOpen}
      />
    </>
  );
}
