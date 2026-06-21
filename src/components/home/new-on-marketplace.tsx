"use client";

import Link from "next/link";
import { Tag } from "lucide-react";
import { useOrders } from "@/hooks/use-orders";
import { AssetCard, AssetCardSkeleton, ScrollSection } from "@medialane/ui";
import { assetHref } from "@/lib/routes";
import type { Chain } from "@medialane/sdk";

export function NewOnMarketplace() {
  const { orders, isLoading } = useOrders({ status: "ACTIVE", limit: 10, page: 1 });

  const listings = orders
    .filter((o) => o.offer.itemType === "ERC721" || o.offer.itemType === "ERC1155")
    .slice(0, 10);

  return (
    <ScrollSection
      icon={<Tag className="h-3.5 w-3.5 text-white" />}
      iconBg="bg-gradient-to-br from-rose-500 to-pink-600 shadow-md shadow-rose-500/20"
      title="New listings"
      href="/marketplace"
      linkLabel="Marketplace"
    >
      {isLoading ? (
        Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="w-72 snap-start shrink-0">
            <AssetCardSkeleton />
          </div>
        ))
      ) : listings.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4">
          No listings yet.{" "}
          <Link href="/create/asset" className="text-primary hover:underline">
            Be the first to list an asset.
          </Link>
        </p>
      ) : (
        listings.map((order) => (
          <div key={order.orderHash} className="w-72 snap-start shrink-0">
            <AssetCard
              href={assetHref(order.chain as Chain, order.nftContract ?? "", order.nftTokenId ?? "")}
              name={order.token?.name ?? `Token #${order.nftTokenId}`}
              image={order.token?.image}
              subtitle={order.token?.description}
              price={order.price}
              fallbackId={order.nftTokenId}
            />
          </div>
        ))
      )}
    </ScrollSection>
  );
}
