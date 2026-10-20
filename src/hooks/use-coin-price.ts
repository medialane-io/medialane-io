"use client";

import { usePriceMap as usePriceMapBase, useCoinPrice as useCoinPriceBase, type CoinCollectionLike } from "@medialane/ui";

export const usePriceMap = () => usePriceMapBase();
export const useCoinPrice = (coin: CoinCollectionLike) => useCoinPriceBase(coin);
