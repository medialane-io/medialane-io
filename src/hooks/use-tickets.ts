"use client";

import useSWR from "swr";
import { Contract, cairo, type Abi } from "starknet";
import { IPTicketCollectionABI } from "@medialane/sdk";
import { starknetProvider } from "@/lib/starknet";
import { useCollectionsByOwner } from "@/hooks/use-collections";

// ── useMyTicketCollections ────────────────────────────────────────────────────
// The signed-in creator's tickets collections (launchpad browse page).

export function useMyTicketCollections(ownerAddress: string | null) {
  const { collections, isLoading, error, mutate } = useCollectionsByOwner(ownerAddress);
  return {
    collections: collections.filter((c) => c.service === "ip-tickets"),
    isLoading,
    error,
    mutate,
  };
}

// ── useTicketOnchain ──────────────────────────────────────────────────────────
// Per-ticket on-chain record via get_ticket(token_id) — supply, minted count,
// validity window, royalty. Failover-covered read provider + SWR.

export interface TicketOnchain {
  maxSupply: bigint;
  minted: bigint;
  startTime: number | null;
  endTime: number | null;
  royaltyBps: number;
}

function parseOption(v: unknown): number | null {
  if (v == null) return null;
  if (typeof v === "object" && v !== null && "unwrap" in v && typeof (v as { unwrap: unknown }).unwrap === "function") {
    const inner = (v as { unwrap: () => unknown }).unwrap();
    return inner != null ? Number(inner as number | bigint) : null;
  }
  if (typeof v === "bigint" || typeof v === "number") return Number(v);
  return null;
}

async function readTicket(contract: string, tokenId: string): Promise<TicketOnchain> {
  const col = new Contract(IPTicketCollectionABI as unknown as Abi, contract, starknetProvider);
  const t = (await col.call("get_ticket", [cairo.uint256(tokenId)])) as {
    max_supply: bigint; minted: bigint; start_time: unknown; end_time: unknown; royalty_bps: bigint | number;
  };
  return {
    maxSupply: BigInt(t.max_supply),
    minted: BigInt(t.minted),
    startTime: parseOption(t.start_time),
    endTime: parseOption(t.end_time),
    royaltyBps: Number(t.royalty_bps),
  };
}

// ── useTicketList ─────────────────────────────────────────────────────────────
// All tickets in a collection, straight from the chain: one ticket_count()
// read, then get_ticket per id. Includes tickets that have never been minted —
// which the indexer can't know about yet.

export interface TicketListItem extends TicketOnchain {
  id: string;
}

async function readTicketCount(contract: string): Promise<number> {
  const col = new Contract(IPTicketCollectionABI as unknown as Abi, contract, starknetProvider);
  return Number(await col.call("ticket_count", []));
}

async function readTicketList(contract: string): Promise<TicketListItem[]> {
  const count = await readTicketCount(contract);
  const tickets: TicketListItem[] = [];
  for (let id = 1; id <= count; id++) {
    tickets.push({ id: String(id), ...(await readTicket(contract, String(id))) });
  }
  return tickets;
}

// ── predictNextTicketId ───────────────────────────────────────────────────────
// Ids are assigned sequentially on-chain starting at 1, and only the collection
// owner can ever call create_ticket. That means the caller minting a new ticket
// can safely predict its id ahead of time (current count + 1) and bundle
// create_ticket + mint into ONE multicall — one PIN unlock instead of two
// separate transactions for what is, from the creator's point of view, a single
// "mint a ticket" action.

export async function predictNextTicketId(contract: string): Promise<number> {
  return (await readTicketCount(contract)) + 1;
}

export function useTicketList(contract: string | null) {
  const { data, error, isLoading, mutate } = useSWR<TicketListItem[]>(
    contract ? `ticket-list-${contract}` : null,
    () => readTicketList(contract!),
    { revalidateOnFocus: false, dedupingInterval: 15_000 }
  );

  return { tickets: data ?? [], isLoading, error, mutate };
}

export function useTicketOnchain(contract: string | null, tokenId: string | null) {
  const { data, error, isLoading } = useSWR<TicketOnchain>(
    contract && tokenId ? `ticket-onchain-${contract}-${tokenId}` : null,
    () => readTicket(contract!, tokenId!),
    { revalidateOnFocus: false, shouldRetryOnError: false, dedupingInterval: 30_000 }
  );

  return { ticket: data ?? null, isLoading, error };
}
