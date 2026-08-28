"use client";

import useSWR from "swr";
import { Contract, type Abi } from "starknet";
import { IPTicketCollectionABI } from "@medialane/sdk/starknet";
import { starknetProvider } from "@/lib/starknet";
import { apiFetch } from "@/lib/api-fetch";
import { useCollectionsByOwner } from "@/hooks/use-collections";

export function useMyTicketCollections(ownerAddress: string | null) {
  const { collections, isLoading, error, mutate } = useCollectionsByOwner(ownerAddress);
  return {
    collections: collections.filter((c) => c.service === "ip-tickets"),
    isLoading,
    error,
    mutate,
  };
}

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

async function readTicketCount(contract: string): Promise<number> {
  const col = new Contract({ abi: IPTicketCollectionABI as unknown as Abi, address: contract, providerOrAccount: starknetProvider });
  return Number(await col.call("ticket_count", []));
}

export async function predictNextTicketId(contract: string): Promise<number> {
  return (await readTicketCount(contract)) + 1;
}

export function useTicketOnchain(contract: string | null, tokenId: string | null) {
  const { data, error, isLoading } = useSWR<TicketOnchain>(
    contract && tokenId ? `ticket-onchain-${contract}-${tokenId}` : null,
    () => readTicket(contract!, tokenId!),
    { revalidateOnFocus: false, shouldRetryOnError: false, dedupingInterval: 30_000 }
  );

  return { ticket: data ?? null, isLoading, error };
}
