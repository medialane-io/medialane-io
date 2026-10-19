"use client";

import {
  useToken as useTokenBase,
  useTokenBalance as useTokenBalanceBase,
  useTokenHistory as useTokenHistoryBase,
  useTokensByOwner as useTokensByOwnerBase,
} from "@medialane/ui";
import { getMedialaneClient } from "@/lib/medialane-client";

export const useToken = (contract: string | null, tokenId: string | null) =>
  useTokenBase(getMedialaneClient, contract, tokenId);
export const useTokenBalance = (contract: string | null, tokenId: string | null, owner: string | null | undefined) =>
  useTokenBalanceBase(getMedialaneClient, contract, tokenId, owner);
export const useTokenHistory = (contract: string | null, tokenId: string | null) =>
  useTokenHistoryBase(getMedialaneClient, contract, tokenId);
export const useTokensByOwner = (address: string | null, page = 1, limit = 20) =>
  useTokensByOwnerBase(getMedialaneClient, address, page, limit, 60_000);
