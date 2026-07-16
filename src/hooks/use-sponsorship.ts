"use client";

import useSWR from "swr";
import { apiFetch } from "@/lib/api-fetch";

// Mirrors medialane-backend's Prisma models 1:1 (src/api/routes/sponsorship.ts) —
// v3: one contract is both the offer/bid/proposal registry and the license
// collection. `duration`/`royaltyBps` are plain numbers; `transferable`/
// `expiresAt` are declarative only, never contract-enforced.

export interface SponsorshipOffer {
  id: string;
  chain: string;
  contractAddress: string;
  offerId: string;
  author: string;
  nftContract: string;
  tokenId: string;
  minAmount: string;
  duration: number;
  paymentToken: string;
  licenseTermsUri: string;
  transferable: boolean;
  royaltyBps: number;
  specificSponsor: string | null;
  open: boolean;
  createdAtChain: string;
  updatedAt: string;
}

export interface SponsorshipBid {
  id: string;
  chain: string;
  contractAddress: string;
  offerId: string;
  sponsor: string;
  amount: string;
  placedAtChain: string;
  updatedAt: string;
}

export interface SponsorshipProposal {
  id: string;
  chain: string;
  contractAddress: string;
  proposalId: string;
  proposer: string;
  nftContract: string;
  tokenId: string;
  amount: string;
  duration: number;
  validUntil: string | null;
  paymentToken: string;
  licenseTermsUri: string;
  transferable: boolean;
  royaltyBps: number;
  open: boolean;
  accepted: boolean | null;
  createdAtChain: string;
  closedAtChain: string | null;
  updatedAt: string;
}

export interface SponsorshipLicense {
  id: string;
  chain: string;
  contractAddress: string;
  tokenId: string;
  author: string;
  recipient: string;
  assetContract: string;
  assetTokenId: string;
  expiresAt: string;
  transferable: boolean;
  royaltyBps: number;
  licenseTermsUri: string;
  offerId: string | null;
  proposalId: string | null;
  mintedAtChain: string;
  currentHolder?: string | null;
}

export function useSponsorshipOffers(params?: { nftContract?: string; author?: string; open?: boolean }) {
  const key = `sponsorship-offers-${JSON.stringify(params ?? {})}`;
  const { data, error, isLoading, mutate } = useSWR<{ data: SponsorshipOffer[]; meta: unknown }>(
    key,
    () => {
      const q = new URLSearchParams({ limit: "50" });
      if (params?.nftContract) q.set("nftContract", params.nftContract);
      if (params?.author) q.set("author", params.author);
      if (params?.open !== undefined) q.set("open", String(params.open));
      return apiFetch<{ data: SponsorshipOffer[]; meta: unknown }>(`/v1/sponsorship/offers?${q}`);
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

export function useSponsorshipProposals(params?: { nftContract?: string; proposer?: string; open?: boolean }) {
  const key = `sponsorship-proposals-${JSON.stringify(params ?? {})}`;
  const { data, error, isLoading, mutate } = useSWR<{ data: SponsorshipProposal[]; meta: unknown }>(
    key,
    () => {
      const q = new URLSearchParams({ limit: "50" });
      if (params?.nftContract) q.set("nftContract", params.nftContract);
      if (params?.proposer) q.set("proposer", params.proposer);
      if (params?.open !== undefined) q.set("open", String(params.open));
      return apiFetch<{ data: SponsorshipProposal[]; meta: unknown }>(`/v1/sponsorship/proposals?${q}`);
    },
    { revalidateOnFocus: false }
  );

  return { proposals: data?.data ?? [], meta: data?.meta, isLoading, error, mutate };
}

export function useSponsorshipProposal(proposalId: string | null) {
  const { data, error, isLoading, mutate } = useSWR<SponsorshipProposal>(
    proposalId ? `sponsorship-proposal-${proposalId}` : null,
    async () => {
      const json = await apiFetch<{ data: SponsorshipProposal }>(`/v1/sponsorship/proposals/${proposalId}`);
      return json.data;
    },
    { revalidateOnFocus: false }
  );

  return { proposal: data ?? null, isLoading, error, mutate };
}

/** Proposals awaiting the CURRENT asset owner's decision — for a specific owned asset. */
export function usePendingProposalsForAsset(nftContract: string | null) {
  const { proposals, isLoading, error, mutate } = useSponsorshipProposals(
    nftContract ? { nftContract, open: true } : undefined
  );
  return { proposals: nftContract ? proposals : [], isLoading, error, mutate };
}
