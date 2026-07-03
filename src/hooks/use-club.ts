"use client";

import useSWR from "swr";
import { apiFetch } from "@/lib/api-fetch";
import type { ApiCollection, ApiMeta } from "@medialane/sdk";

export function useClubCollections() {
  const { data, error, isLoading, mutate } = useSWR<{ data: ApiCollection[]; meta: ApiMeta }>(
    "ip-club-collections",
    () =>
      apiFetch<{ data: ApiCollection[]; meta: ApiMeta }>(
        `/v1/collections?${new URLSearchParams({ service: "ip-club", limit: "50" })}`
      ),
    { revalidateOnFocus: false }
  );

  return { collections: data?.data ?? [], meta: data?.meta, isLoading, error, mutate };
}

export interface ClubInfo {
  clubNftAddress: string;
  open: boolean;
  numMembers: number;
  maxMembers: number | null;
  entryFee: string | null;
  paymentToken: string | null;
}

/** The registry's own ClubRecord fields (open/entry fee/member cap) — distinct
 *  from the Collection row, which only indexes the club_nft contract. */
export function useClubInfo(clubId: string | null) {
  const { data, error, isLoading, mutate } = useSWR<ClubInfo>(
    clubId ? `club-info-${clubId}` : null,
    async () => {
      const json = await apiFetch<{ data: ClubInfo }>(`/v1/club/${clubId}/info`);
      return json.data;
    },
    { revalidateOnFocus: false, shouldRetryOnError: false }
  );

  return { info: data ?? null, isLoading, error, mutate };
}

export function useClubMembership(clubAddress: string | null, clubId: string | null, wallet: string | null) {
  const key = clubAddress && clubId && wallet ? `club-membership-${clubAddress}-${clubId}-${wallet}` : null;

  const { data, error, isLoading, mutate } = useSWR<{ isMember: boolean }>(
    key,
    async () => {
      const json = await apiFetch<{ data: { isMember: boolean } }>(
        `/v1/club/${clubAddress}/${clubId}/membership/${wallet}`
      );
      return json.data;
    },
    { revalidateOnFocus: false, shouldRetryOnError: false }
  );

  return { isMember: data?.isMember ?? false, isLoading, error, mutate };
}
