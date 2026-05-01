"use client";

import { useState } from "react";
import {
  ShoppingCart, Tag, ArrowRightLeft, X, HandCoins,
  GitBranch, Check, Flag, ArrowUpRight, Layers, Zap,
} from "lucide-react";
import { CurrencyIcon } from "@/components/shared/currency-icon";
import { PurchaseDialog } from "@/components/marketplace/purchase-dialog";
import { OfferDialog } from "@/components/marketplace/offer-dialog";
import { ListingDialog } from "@/components/marketplace/listing-dialog";
import { ReportDialog } from "@/components/report-dialog";
import { ipfsToHttp, formatDisplayPrice } from "@/lib/utils";
import { useCart } from "@/hooks/use-cart";
import { toast } from "sonner";
import {
  PreviewHero, PreviewFooter, PreviewActionList, PreviewMeta, PreviewOwnerRow,
  type AssetPreviewContentProps, type PreviewAction,
} from "./asset-preview-dialog";

export function AssetPreviewStandard({
  token, isOwner, onClose, onList, onCancel, onTransfer,
}: AssetPreviewContentProps) {
  const { addItem, items } = useCart();
  const [imgError, setImgError] = useState(false);
  const [buyOpen, setBuyOpen] = useState(false);
  const [offerOpen, setOfferOpen] = useState(false);
  const [listOpen, setListOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  const name = token.metadata?.name || `Token #${token.tokenId}`;
  const image = imgError ? null : (ipfsToHttp(token.metadata?.image) ?? null);
  const activeOrder = token.activeOrders?.[0] ?? null;
  const inCart = activeOrder ? items.some((i) => i.orderHash === activeOrder.orderHash) : false;

  const assetHref = `/asset/${token.contractAddress}/${token.tokenId}`;
  const collectionHref = `/collections/${token.contractAddress}`;
  const remixHref = `/create/remix/${token.contractAddress}/${token.tokenId}`;
  const currentOwner = token.balances?.[0]?.owner ?? token.owner ?? null;
  const ownerHref = currentOwner ? `/account/${currentOwner}` : null;

  const handleAddToCart = () => {
    if (!activeOrder || inCart) return;
    addItem({
      orderHash: activeOrder.orderHash,
      nftContract: token.contractAddress,
      nftTokenId: token.tokenId,
      itemType: activeOrder.offer.itemType === "ERC1155" ? "ERC1155" : "ERC721",
      name,
      image: token.metadata?.image ?? "",
      price: formatDisplayPrice(activeOrder.price.formatted),
      currency: activeOrder.price.currency ?? "",
      currencyDecimals: activeOrder.price.decimals,
      offerer: activeOrder.offerer ?? "",
      considerationToken: activeOrder.consideration.token ?? "",
      considerationAmount: activeOrder.consideration.startAmount ?? "",
    });
    toast.success("Added to cart", { description: name });
  };

  const handleList = () => {
    if (onList) { onClose(); onList(token); } else setListOpen(true);
  };

  const handleCancel = () => {
    if (onCancel) { onClose(); onCancel(token); }
  };

  const handleTransfer = () => {
    if (onTransfer) { onClose(); onTransfer(token); }
  };

  // ── Primary CTA ─────────────────────────────────────────────────────────────
  const renderPrimary = () => {
    if (!isOwner && activeOrder) {
      return (
        <div className="btn-border-animated p-[1px] rounded-xl">
          <button
            type="button"
            className="w-full h-11 rounded-[11px] flex items-center justify-center gap-2 text-sm font-semibold text-white transition-all hover:brightness-110 active:scale-[0.98] bg-background/30"
            onClick={() => setBuyOpen(true)}
          >
            <Zap className="h-4 w-4" />
            Buy now
            <span className="flex items-center gap-0.5 ml-1 text-white/80 text-xs font-normal">
              <CurrencyIcon symbol={activeOrder.price.currency ?? ""} size={11} />
              {formatDisplayPrice(activeOrder.price.formatted)}
              <span className="ml-0.5">{activeOrder.price.currency}</span>
            </span>
          </button>
        </div>
      );
    }
    if (isOwner && !activeOrder) {
      return (
        <button
          type="button"
          className="w-full h-11 rounded-xl bg-brand-blue text-white text-sm font-semibold flex items-center justify-center gap-2 hover:brightness-110 active:scale-[0.98] transition-all"
          onClick={handleList}
        >
          <Tag className="h-4 w-4" />
          List for sale
        </button>
      );
    }
    if (isOwner && activeOrder) {
      return (
        <button
          type="button"
          className="w-full h-11 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-sm font-semibold flex items-center justify-center gap-2 hover:bg-destructive/20 active:scale-[0.98] transition-all"
          onClick={handleCancel}
        >
          <X className="h-4 w-4" />
          Cancel listing
        </button>
      );
    }
    return null;
  };

  // ── Secondary actions ────────────────────────────────────────────────────────
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
    { icon: <GitBranch className="h-4 w-4" />, label: "Create a remix", href: remixHref, onClick: onClose, className: "text-brand-purple" },
    { icon: <Layers className="h-4 w-4" />, label: "View collection", href: collectionHref, onClick: onClose },
  );

  if (isOwner && onTransfer) {
    secondaryActions.push({ icon: <ArrowRightLeft className="h-4 w-4" />, label: "Transfer asset", onClick: handleTransfer });
  }

  secondaryActions.push({
    icon: <Flag className="h-4 w-4" />,
    label: "Report",
    onClick: () => setReportOpen(true),
    className: "text-muted-foreground/60",
    fullWidth: true,
  });

  return (
    <>
      <PreviewHero image={image} name={name} ipType={token.metadata?.ipType} />

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
            <p className="text-xs text-muted-foreground">{activeOrder.price.currency}</p>
          </div>
        )}
      </div>

      <PreviewMeta token={token} />
      {currentOwner && <PreviewOwnerRow owner={currentOwner} />}

      {/* Actions */}
      <div className="px-5 pb-2 pt-3 space-y-2 flex-1 overflow-y-auto">
        {renderPrimary()}
        <PreviewActionList actions={secondaryActions} />
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
        tokenStandard={token.standard}
      />
      <ListingDialog
        open={listOpen}
        onOpenChange={setListOpen}
        assetContract={token.contractAddress}
        tokenId={token.tokenId}
        tokenName={name}
        tokenStandard={token.standard}
        tokenImage={image}
        onSuccess={() => { setListOpen(false); onClose(); }}
      />
      <ReportDialog
        target={{ type: "TOKEN", contract: token.contractAddress, tokenId: token.tokenId, name }}
        open={reportOpen}
        onOpenChange={setReportOpen}
      />
    </>
  );
}
