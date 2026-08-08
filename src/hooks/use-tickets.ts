"use client";

import useSWR from "swr";
import { Contract, cairo, type Abi } from "starknet";
import { IPTicketCollectionABI } from "@medialane/sdk/starknet";
import { starknetProvider } from "@/lib/starknet";
import { apiFetch } from "@/lib/api-fetch";
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
// Per-ticket record (supply, minted count, validity window, royalty), served
// by the backend's metered GET /v1/tickets/:contract/:tokenId pass-through
// (medialane-backend/src/api/routes/tickets-onchain.ts) — the backend does
// the same get_ticket(token_id) read server-side, credited, instead of the
// browser reading the chain directly and evading the credit gate.

export interface TicketOnchain {
  maxSupply: bigint;
  minted: bigint;
  startTime: number | null;
  endTime: number | null;
  royaltyBps: number;
}

interface TicketOnchainResponse {
  maxSupply: string;
  minted: string;
  startTime: number | null;
  endTime: number | null;
  royaltyBps: number;
}

async function readTicket(contract: string, tokenId: string): Promise<TicketOnchain> {
  const { data } = await apiFetch<{ data: TicketOnchainResponse }>(`/v1/tickets/${contract}/${tokenId}`);
  return {
    maxSupply: BigInt(data.maxSupply),
    minted: BigInt(data.minted),
    startTime: data.startTime,
    endTime: data.endTime,
    royaltyBps: data.royaltyBps,
  };
}

// ── useTicketList ─────────────────────────────────────────────────────────────
// All tickets in a collection: one count read, then one ticket read per id,
// both via the credited backend routes above. Includes tickets that have
// never been minted — which the indexer can't know about yet.

export interface TicketListItem extends TicketOnchain {
  id: string;
}

async function readTicketCountBilled(contract: string): Promise<number> {
  const { data } = await apiFetch<{ data: { count: number } }>(`/v1/tickets/${contract}/count`);
  return data.count;
}

async function readTicketList(contract: string): Promise<TicketListItem[]> {
  const count = await readTicketCountBilled(contract);
  const tickets: TicketListItem[] = [];
  for (let id = 1; id <= count; id++) {
    tickets.push({ id: String(id), ...(await readTicket(contract, String(id))) });
  }
  return tickets;
}

// ── readTicketCount (raw RPC) ─────────────────────────────────────────────────
// Deliberately NOT routed through the backend: predictNextTicketId below fires
// immediately before bundling create_ticket+mint into one multicall and needs
// the freshest possible on-chain count for that to be correct — same class as
// a nonce/fee-estimate read, not a discovery read the credited backend could
// serve instead (same precedent as io's club-id prediction and the dapp's own
// ticket-id prediction).
async function readTicketCount(contract: string): Promise<number> {
  const col = new Contract({ abi: IPTicketCollectionABI as unknown as Abi, address: contract, providerOrAccount: starknetProvider });
  return Number(await col.call("ticket_count", []));
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
