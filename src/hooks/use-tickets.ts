"use client";

import useSWR from "swr";
import { apiFetch } from "@/lib/api-fetch";
import type { ApiCollection, ApiMeta } from "@medialane/sdk";

export interface TicketStatus {
  hasValidTicket: boolean;
  activeBalance: number;
}

export interface TicketCollectionBatch {
  ticketCollectionId: string;
  price: string;
  maxSupply: string;
  minted: string;
  expiration: string;
  royaltyBps: number;
  paymentToken: string | null;
  metadataUri: string;
  active: boolean;
}

export function useTicketCollections() {
  const { data, error, isLoading, mutate } = useSWR<{ data: ApiCollection[]; meta: ApiMeta }>(
    "ip-tickets-collections",
    () =>
      apiFetch<{ data: ApiCollection[]; meta: ApiMeta }>(
        `/v1/collections?${new URLSearchParams({ service: "ip-tickets", limit: "50" })}`
      ),
    { revalidateOnFocus: false }
  );

  return { collections: data?.data ?? [], meta: data?.meta, isLoading, error, mutate };
}

export function useMyTicketCollections(ownerAddress: string | null) {
  const { data, error, isLoading, mutate } = useSWR<{ data: ApiCollection[] }>(
    ownerAddress ? `my-ticket-collections-${ownerAddress}` : null,
    () =>
      apiFetch<{ data: ApiCollection[] }>(
        `/v1/collections?${new URLSearchParams({ service: "ip-tickets", owner: ownerAddress!, limit: "50" })}`
      ),
    { revalidateOnFocus: false }
  );

  return { collections: data?.data ?? [], isLoading, error, mutate };
}

/** Lists the inner ticket collections (event/tier batches) inside one deployed contract. */
export function useTicketCollectionBatches(contractAddress: string | null) {
  const { data, error, isLoading, mutate } = useSWR<TicketCollectionBatch[]>(
    contractAddress ? `ticket-collection-batches-${contractAddress}` : null,
    async () => {
      const json = await apiFetch<{ data: TicketCollectionBatch[] }>(
        `/v1/tickets/${contractAddress}/collections`
      );
      return json.data;
    },
    { revalidateOnFocus: false }
  );

  return { batches: data ?? [], isLoading, error, mutate };
}

export function useTicketStatus(
  collectionAddress: string | null,
  ticketCollectionId: string | null,
  wallet: string | null
) {
  const key =
    collectionAddress && ticketCollectionId && wallet
      ? `ticket-status-${collectionAddress}-${ticketCollectionId}-${wallet}`
      : null;

  const { data, error, isLoading, mutate } = useSWR<TicketStatus>(
    key,
    async () => {
      const json = await apiFetch<{ data: TicketStatus }>(
        `/v1/tickets/${collectionAddress}/${ticketCollectionId}/status/${wallet}`
      );
      return json.data;
    },
    { revalidateOnFocus: false, shouldRetryOnError: false }
  );

  return { status: data ?? null, isLoading, error, mutate };
}
