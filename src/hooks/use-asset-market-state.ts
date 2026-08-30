"use client";

import { normalizeAddress } from "@medialane/sdk";
import type { ApiActivity, ApiOrder, ApiToken, ApiCollection } from "@medialane/sdk";
import { checkIsOwner } from "@/lib/utils";
import { useUsdPrices } from "@/hooks/use-usd-prices";
import { usdValueFor } from "@/lib/wallet-format";

export interface AssetMarketState {
  activeListings: ApiOrder[];
  activeBids: ApiOrder[];
  cheapest: ApiOrder | undefined;
  cheapestUsd: string | null;
  lastSaleRaw: string | null;
  isOwner: boolean;
  isERC1155: boolean;
  holders: NonNullable<ApiToken["balances"]>;
  quantityOwned: string | undefined;
  myListing: ApiOrder | null;
}

export function isSaleableListing(order: ApiOrder): boolean {
  return (
    order.status === "ACTIVE" &&
    (order.offer.itemType === "ERC721" || order.offer.itemType === "ERC1155")
  );
}

export function isBid(order: ApiOrder): boolean {
  return order.status === "ACTIVE" && order.offer.itemType === "ERC20";
}

export function cheapestOf(listings: ApiOrder[]): ApiOrder | undefined {
  return [...listings].sort((a, b) =>
    BigInt(a.consideration.startAmount) < BigInt(b.consideration.startAmount) ? -1 : 1,
  )[0];
}

export function latestSale(history: ApiActivity[]): ApiActivity | null {
  return history
    .filter((h) => h.type === "sale" && h.price?.formatted)
    .reduce<ApiActivity | null>(
      (latest, h) => (!latest || h.timestamp > latest.timestamp ? h : latest),
      null,
    );
}

export function formatSale(sale: ApiActivity | null): string | null {
  if (!sale?.price) return null;
  return `${sale.price.formatted} ${sale.price.currency ?? ""}`.trim();
}

export function useAssetMarketState({
  token,
  collection,
  listings,
  history,
  walletAddress,
}: {
  token: ApiToken | null | undefined;
  collection: ApiCollection | null | undefined;
  listings: ApiOrder[];
  history: ApiActivity[];
  walletAddress: string | null | undefined;
}): AssetMarketState {
  const activeListings = listings.filter(isSaleableListing);
  const activeBids = listings.filter(isBid);
  const cheapest = cheapestOf(activeListings);

  const usdPrices = useUsdPrices();
  const cheapestUsd = usdValueFor(cheapest?.price?.formatted, cheapest?.price?.currency, usdPrices);

  const lastSaleRaw = formatSale(latestSale(history));

  const isOwner = checkIsOwner(token, walletAddress);
  const isERC1155 = (token?.standard ?? collection?.standard) === "ERC1155";

  const holders = token?.balances ?? [];
  const quantityOwned = walletAddress
    ? holders.find(
        (h) => normalizeAddress("STARKNET", h.owner) === normalizeAddress("STARKNET", walletAddress),
      )?.amount
    : undefined;

  const myListing =
    isOwner && walletAddress
      ? (activeListings.find(
          (l) => normalizeAddress("STARKNET", l.offerer) === normalizeAddress("STARKNET", walletAddress),
        ) ?? null)
      : null;

  return {
    activeListings,
    activeBids,
    cheapest,
    cheapestUsd,
    lastSaleRaw,
    isOwner,
    isERC1155,
    holders,
    quantityOwned,
    myListing,
  };
}
