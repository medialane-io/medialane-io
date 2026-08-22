"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ListingCard as PackageListingCard,
  ListingCardSkeleton,
} from "@medialane/ui";
import { ipfsToHttp } from "@/lib/utils";
import { usdValueFor } from "@/lib/wallet-format";
import { useUsdPrices } from "@/hooks/use-usd-prices";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, ExternalLink, Layers, Flag } from "lucide-react";
import { ReportDialog } from "@/components/report-dialog";
import type { ApiOrder } from "@medialane/sdk";
import { assetHref, collectionHref } from "@/lib/routes";

export { ListingCardSkeleton };

interface ListingCardProps {
  order: ApiOrder;
  onBuy?: (order: ApiOrder) => void;
  compact?: boolean;
}

export function ListingCard({ order, onBuy, compact = false }: ListingCardProps) {
  const [reportOpen, setReportOpen] = useState(false);
  const usdPrices = useUsdPrices();
  const usdValue = usdValueFor(order.price?.formatted, order.price?.currency, usdPrices);

  const imageUrl = order.token?.image ? ipfsToHttp(order.token.image, 640) : null;

  const overflowMenu = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          className="h-9 w-9 p-0 shrink-0 rounded-[9px]"
          onClick={(e) => e.preventDefault()}
          aria-label="More actions"
        >
          <MoreHorizontal className="h-3.5 w-3.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem asChild>
          <Link href={assetHref("STARKNET", order.nftContract, order.nftTokenId)} className="flex items-center gap-2">
            <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
            View Asset
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={collectionHref("STARKNET", order.nftContract)} className="flex items-center gap-2">
            <Layers className="h-3.5 w-3.5 text-muted-foreground" />
            View Collection
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="flex items-center gap-2 text-destructive focus:text-destructive"
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
        onBuy={onBuy}
        compact={compact}
        overflowMenu={overflowMenu}
        imageUrl={imageUrl}
        usdValue={usdValue}
      />
      {reportOpen && (
        <ReportDialog
          target={{
            type: "TOKEN",
            contract: order.nftContract ?? "",
            tokenId: order.nftTokenId ?? "",
            name: order.token?.name ?? undefined,
          }}
          open={reportOpen}
          onOpenChange={setReportOpen}
        />
      )}
    </>
  );
}
