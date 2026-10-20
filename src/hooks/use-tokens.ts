"use client";

import {
  useToken as useTokenBase,
  useTokenBalance as useTokenBalanceBase,
  useTokenHistory as useTokenHistoryBase,
  useTokensByOwner as useTokensByOwnerBase,
} from "@medialane/ui";

export const useToken = (contract: string | null, tokenId: string | null) =>
  useTokenBase(contract, tokenId);
export const useTokenBalance = (contract: string | null, tokenId: string | null, owner: string | null | undefined) =>
  useTokenBalanceBase(contract, tokenId, owner);
export const useTokenHistory = (contract: string | null, tokenId: string | null) =>
  useTokenHistoryBase(contract, tokenId);
export const useTokensByOwner = (address: string | null, page = 1, limit = 20) =>
  useTokensByOwnerBase(address, page, limit, 60_000);
