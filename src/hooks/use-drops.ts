"use client";

import useSWR from "swr";
import { Contract, type Abi } from "starknet";
import { apiFetch } from "@/lib/api-fetch";
import { publicReadProvider } from "@/lib/starknet";
import { DropCollectionReadABI } from "@/lib/launchpad-contracts";
import type { ApiCollection, ApiMeta } from "@medialane/sdk";

export interface DropMintStatus {
  mintedByWallet: number;
  totalMinted: number;
}

export interface DropConditions {
  maxSupply: string;
  price: string;
  paymentToken: string;
  startTime: number;
  endTime: number;
  maxPerWallet: string;
}

export interface ApiDropInfo {
  contractAddress: string;
  name: string | null;
  symbol: string | null;
  description: string | null;
  image: string | null;
  owner: string | null;
  totalMinted: number;
  conditions: DropConditions | null;
}

export type DropStatus = "upcoming" | "live" | "ended" | "sold_out";

export function getDropStatus(conditions: DropConditions | null, totalMinted: number): DropStatus {
  if (!conditions) return "live";
  const now = Math.floor(Date.now() / 1000);
  const max = parseInt(conditions.maxSupply, 10);
  if (max > 0 && totalMinted >= max) return "sold_out";
  if (now < conditions.startTime) return "upcoming";
  if (now > conditions.endTime) return "ended";
  return "live";
}

export function useDropCollections() {
  const { data, error, isLoading, mutate } = useSWR<{ data: ApiCollection[]; meta: ApiMeta }>(
    "drop-collections",
    () =>
      apiFetch<{ data: ApiCollection[]; meta: ApiMeta }>(
        `/v1/collections?${new URLSearchParams({ service: "drop-collection", hideEmpty: "false", limit: "50" })}`
      ),
    { revalidateOnFocus: false }
  );

  return {
    collections: data?.data ?? [],
    meta: data?.meta,
    isLoading,
    error,
    mutate,
  };
}

export function useDropMintStatus(collection: string | null, wallet: string | null) {
  const key = collection && wallet ? `drop-mint-status-${collection}-${wallet}` : null;

  const { data, error, isLoading, mutate } = useSWR<DropMintStatus>(
    key,
    async () => {
      const json = await apiFetch<{ data: DropMintStatus }>(`/v1/drop/mint-status/${collection}/${wallet}`);
      return json.data;
    },
    { revalidateOnFocus: false, shouldRetryOnError: false }
  );

  return { mintStatus: data ?? null, isLoading, error, mutate };
}

export function useDropInfo(contractAddress: string | null) {
  const key = contractAddress ? `drop-info-${contractAddress}` : null;

  const { data, error, isLoading } = useSWR<ApiDropInfo>(
    key,
    async () => {
      const json = await apiFetch<{ data: ApiDropInfo }>(`/v1/drop/${contractAddress}/info`);
      return json.data;
    },
    { revalidateOnFocus: false, shouldRetryOnError: false }
  );

  return { dropInfo: data ?? null, isLoading, error };
}

export interface OnChainDropState {
  conditions: DropConditions | null;
  totalMinted: number;
  maxSupply: number;
  allowlistEnabled: boolean;
  paused: boolean;
}

// Reads live drop state directly from the DropCollection contract — the only authority
// for current conditions/supply (architecture 01 §I). Replaces the fragile backend
// conditions mirror that the create flow wrote fire-and-forget.
export function useOnChainDropState(contract: string | null) {
  const { data, error, isLoading, mutate } = useSWR<OnChainDropState>(
    contract ? `drop-onchain-${contract}` : null,
    async () => {
      // Public drop pages (viewable logged-out) → keyless public RPC, not the
      // Clerk-gated /api/rpc proxy (which 401s anonymous visitors).
      const c = new Contract(DropCollectionReadABI as unknown as Abi, contract!, publicReadProvider);
      const [cond, minted, max, allow, paused] = await Promise.all([
        c.get_claim_conditions() as Promise<{
          start_time: bigint; end_time: bigint; price: bigint;
          payment_token: bigint | string; max_quantity_per_wallet: bigint;
        }>,
        c.total_minted() as Promise<bigint>,
        c.get_max_supply() as Promise<bigint>,
        c.is_allowlist_enabled() as Promise<boolean | bigint>,
        c.is_paused() as Promise<boolean | bigint>,
      ]);
      const paymentToken =
        typeof cond.payment_token === "bigint" ? "0x" + cond.payment_token.toString(16) : String(cond.payment_token);
      return {
        conditions: {
          maxSupply: BigInt(max).toString(),
          price: BigInt(cond.price).toString(),
          paymentToken,
          startTime: Number(cond.start_time),
          endTime: Number(cond.end_time),
          maxPerWallet: BigInt(cond.max_quantity_per_wallet).toString(),
        },
        totalMinted: Number(minted),
        maxSupply: Number(max),
        allowlistEnabled: Boolean(typeof allow === "bigint" ? allow : allow ? 1n : 0n),
        paused: Boolean(typeof paused === "bigint" ? paused : paused ? 1n : 0n),
      };
    },
    {
      revalidateOnFocus: false,
      refreshInterval: 30_000,
      shouldRetryOnError: false,
      // The drop listing renders many of these at once; a transient public-RPC
      // hiccup must not spawn a storm of global toasts. getDropStatus falls back
      // to "live" when state is null. Log only (local onError overrides global).
      onError: (err) => {
        if (process.env.NODE_ENV !== "production") {
          console.warn(`[drop-onchain] read failed for ${contract}:`, err);
        }
      },
    }
  );

  return { state: data ?? null, isLoading, error, mutate };
}
