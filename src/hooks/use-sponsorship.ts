"use client";

import useSWR from "swr";
import { apiFetch } from "@/lib/api-fetch";

export interface SponsorshipOffer {
  id: string;
  chain: string;
  sponsorshipContract: string;
  offerId: string;
  author: string;
  nftContract: string;
  tokenId: string;
  minAmount: string;
  duration: string;
  paymentToken: string;
  licenseTermsUri: string;
  transferable: boolean;
  specificSponsor: string | null;
  open: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SponsorshipBid {
  id: string;
  offerId: string;
  sponsor: string;
  amount: string;
  status: "ACTIVE" | "RETRACTED" | "ACCEPTED";
  updatedAt: string;
}

export function useSponsorshipOffers(nftContract?: string) {
  const key = nftContract ? `sponsorship-offers-${nftContract}` : "sponsorship-offers";
  const { data, error, isLoading, mutate } = useSWR<{ data: SponsorshipOffer[]; meta: unknown }>(
    key,
    () => {
      const params = new URLSearchParams({ limit: "50" });
      if (nftContract) params.set("nftContract", nftContract);
      return apiFetch<{ data: SponsorshipOffer[]; meta: unknown }>(`/v1/sponsorship/offers?${params}`);
    },
    { revalidateOnFocus: false }
  );

  return { offers: data?.data ?? [], meta: data?.meta, isLoading, error, mutate };
}

export function useSponsorshipOffer(offerId: string | null) {
  const { data, error, isLoading, mutate } = useSWR<SponsorshipOffer>(
    offerId ? `sponsorship-offer-${offerId}` : null,
    async () => {
      const json = await apiFetch<{ data: SponsorshipOffer }>(`/v1/sponsorship/offers/${offerId}`);
      return json.data;
    },
    { revalidateOnFocus: false }
  );

  return { offer: data ?? null, isLoading, error, mutate };
}

export function useSponsorshipBids(offerId: string | null) {
  const { data, error, isLoading, mutate } = useSWR<SponsorshipBid[]>(
    offerId ? `sponsorship-bids-${offerId}` : null,
    async () => {
      const json = await apiFetch<{ data: SponsorshipBid[] }>(`/v1/sponsorship/offers/${offerId}/bids`);
      return json.data;
    },
    { revalidateOnFocus: false }
  );

  return { bids: data ?? [], isLoading, error, mutate };
}
