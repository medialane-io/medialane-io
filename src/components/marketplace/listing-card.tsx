"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSWRConfig } from "swr";
import {
  ListingCard as PackageListingCard,
  ListingCardSkeleton,
} from "@medialane/ui";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Layers, ArrowRightLeft, Flag, GitBranch, HandCoins, ArrowUpRight, Zap, UserCircle2, XCircle, Loader2 } from "lucide-react";
import { CurrencyIcon } from "@/components/shared/currency-icon";
import { ipfsToHttp, formatDisplayPrice } from "@/lib/utils";
import { useMarketplace } from "@/hooks/use-marketplace";
import { useUsdPrices } from "@/hooks/use-usd-prices";
import { usdValueFor } from "@/lib/wallet-format";
import { CancelListingDialog } from "@/app/asset/[chain]/[contract]/[tokenId]/cancel-listing-dialog";
import { assetHref, collectionHref } from "@/lib/routes";
import { ReportDialog } from "@/components/report-dialog";
import type { ApiOrder } from "@medialane/sdk";
import { friendlyErrorMessage } from "@/lib/friendly-error";

export { ListingCardSkeleton };

interface ListingCardProps {
  order: ApiOrder;
  onBuy?: (order: ApiOrder) => void;

  compact?: boolean;

  isOwner?: boolean;
}

export function ListingCard({ order, onBuy, compact = false, isOwner = false }: ListingCardProps) {
  const router = useRouter();
  const { mutate } = useSWRConfig();
  const { cancelOrder } = useMarketplace();
  const usdPrices = useUsdPrices();
  const usdValue = usdValueFor(order.price?.formatted, order.price?.currency, usdPrices);

  const [reportOpen, setReportOpen] = useState(false);

  const [cancelStep, setCancelStep] = useState<"idle" | "processing" | "success" | "error">("idle");
  const [cancelError, setCancelError] = useState<string | null>(null);

  const invalidateOrders = () =>
    mutate((key) => typeof key === "string" && key.includes("/v1/orders"), undefined, { revalidate: true });

  const handleCancelClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    setCancelStep("processing");
    setCancelError(null);
    try {
      const nftStandard = order.offer.itemType === "ERC20"
        ? order.consideration.itemType
        : order.offer.itemType;
      const hash = await cancelOrder({ orderHash: order.orderHash, tokenStandard: nftStandard });
      if (!hash) throw new Error("Cancellation failed");
      setCancelStep("success");
      invalidateOrders();
    } catch (err) {
      setCancelStep("error");
      setCancelError(friendlyErrorMessage(err, "Cancellation failed"));
    }
  };

  const isListing = order.offer.itemType === "ERC721" || order.offer.itemType === "ERC1155";
  const name = order.token?.name ?? `Token #${order.nftTokenId}`;
  const image = order.token?.image ? ipfsToHttp(order.token.image) : null;

  if (compact) {
    return <PackageListingCard order={order} compact usdValue={usdValue} />;
  }

  const cancelPrimary = (
    <button
      disabled={cancelStep === "processing"}
      className="flex-1 h-9 flex items-center justify-center gap-1.5 rounded-[9px] border border-brand-orange/50 bg-brand-orange/10 text-brand-orange text-xs font-semibold hover:bg-brand-orange/20 transition-all active:scale-[0.98] disabled:opacity-60 disabled:pointer-events-none"
      onClick={handleCancelClick}
    >
      {cancelStep === "processing"
        ? <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" />
        : <XCircle className="h-3.5 w-3.5 shrink-0" />}
      Cancel
    </button>
  );

  const ownerMenu = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm" variant="outline" className="h-9 w-9 p-0 shrink-0 rounded-[9px]" onClick={(e) => e.preventDefault()} aria-label="More actions">
          <MoreHorizontal className="h-3.5 w-3.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem asChild>
          <Link href={assetHref("STARKNET", order.nftContract, order.nftTokenId)} className="flex items-center gap-2">
            <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground" />
            View asset
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="flex items-center gap-2 text-brand-orange focus:text-brand-orange" onClick={handleCancelClick}>
          <XCircle className="h-3.5 w-3.5" />
          Cancel listing
        </DropdownMenuItem>
        <DropdownMenuItem
          className="flex items-center gap-2 text-brand-purple focus:text-brand-purple"
          onClick={(e) => { e.preventDefault(); router.push(`/create/remix/${order.nftContract}/${order.nftTokenId}`); }}
        >
          <GitBranch className="h-3.5 w-3.5" />
          Remix
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href={collectionHref("STARKNET", order.nftContract)} className="flex items-center gap-2">
            <Layers className="h-3.5 w-3.5 text-muted-foreground" />
            View collection
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={assetHref("STARKNET", order.nftContract, order.nftTokenId)} className="flex items-center gap-2">
            <ArrowRightLeft className="h-3.5 w-3.5 text-muted-foreground" />
            Transfer
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const buyerMenu = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm" variant="outline" className="h-9 w-9 p-0 shrink-0 rounded-[9px]" onClick={(e) => e.preventDefault()} aria-label="More actions">
          <MoreHorizontal className="h-3.5 w-3.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem asChild>
          <Link href={assetHref("STARKNET", order.nftContract, order.nftTokenId)} className="flex items-center gap-2">
            <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground" />
            View asset
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {onBuy && (
          <DropdownMenuItem
            className="flex items-center gap-2 text-brand-blue focus:text-brand-blue"
            onClick={(e) => { e.preventDefault(); onBuy(order); }}
          >
            <Zap className="h-3.5 w-3.5" />
            <span className="flex items-center gap-1">
              Buy —
              <CurrencyIcon symbol={order.price.currency} size={12} />
              {formatDisplayPrice(order.price.formatted)}
            </span>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem
          className="flex items-center gap-2 text-brand-orange focus:text-brand-orange"
          onClick={(e) => { e.preventDefault(); router.push(assetHref("STARKNET", order.nftContract, order.nftTokenId)); }}
        >
          <HandCoins className="h-3.5 w-3.5" />
          Make offer
        </DropdownMenuItem>
        <DropdownMenuItem
          className="flex items-center gap-2 text-brand-purple focus:text-brand-purple"
          onClick={(e) => { e.preventDefault(); router.push(`/create/remix/${order.nftContract}/${order.nftTokenId}`); }}
        >
          <GitBranch className="h-3.5 w-3.5" />
          Remix
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href={collectionHref("STARKNET", order.nftContract)} className="flex items-center gap-2">
            <Layers className="h-3.5 w-3.5 text-muted-foreground" />
            View collection
          </Link>
        </DropdownMenuItem>
        {order.offerer && (
          <DropdownMenuItem asChild>
            <Link href={`/account/${order.offerer}`} className="flex items-center gap-2">
              <UserCircle2 className="h-3.5 w-3.5 text-muted-foreground" />
              View owner
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem asChild>
          <Link href={assetHref("STARKNET", order.nftContract, order.nftTokenId)} className="flex items-center gap-2">
            <ArrowRightLeft className="h-3.5 w-3.5 text-muted-foreground" />
            Transfer
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="flex items-center gap-2 text-muted-foreground focus:text-muted-foreground"
          onClick={(e) => { e.preventDefault(); setReportOpen(true); }}
        >
          <Flag className="h-3.5 w-3.5" />
          Report
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const offerMenu = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm" variant="outline" className="h-9 w-9 p-0 shrink-0 rounded-[9px]" onClick={(e) => e.preventDefault()} aria-label="More actions">
          <MoreHorizontal className="h-3.5 w-3.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem asChild>
          <Link href={collectionHref("STARKNET", order.nftContract)} className="flex items-center gap-2">
            <Layers className="h-3.5 w-3.5 text-muted-foreground" />
            View collection
          </Link>
        </DropdownMenuItem>
        {order.offerer && (
          <DropdownMenuItem asChild>
            <Link href={`/account/${order.offerer}`} className="flex items-center gap-2">
              <UserCircle2 className="h-3.5 w-3.5 text-muted-foreground" />
              View bidder
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="flex items-center gap-2 text-muted-foreground focus:text-muted-foreground"
          onClick={(e) => { e.preventDefault(); setReportOpen(true); }}
        >
          <Flag className="h-3.5 w-3.5" />
          Report
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <>
      <PackageListingCard
        order={order}
        onBuy={isListing && !isOwner ? onBuy : undefined}
        primaryAction={isListing && isOwner ? cancelPrimary : undefined}
        overflowMenu={isListing ? (isOwner ? ownerMenu : buyerMenu) : offerMenu}
        usdValue={usdValue}
      />

      {reportOpen && (
        <ReportDialog
          target={{ type: "TOKEN", contract: order.nftContract ?? "", tokenId: order.nftTokenId ?? "", name: order.token?.name ?? undefined }}
          open={reportOpen}
          onOpenChange={setReportOpen}
        />
      )}

      <CancelListingDialog
        cancelStep={cancelStep}
        cancelError={cancelError}
        tokenName={name}
        tokenImage={image}
        onReset={() => { setCancelStep("idle"); setCancelError(null); }}
      />
    </>
  );
}
