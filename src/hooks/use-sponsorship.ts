"use client";

import * as ui from "@medialane/ui";

export type {
  ApiSponsorshipOffer as SponsorshipOffer,
  ApiSponsorshipBid as SponsorshipBid,
  ApiSponsorshipProposal as SponsorshipProposal,
  ApiSponsorshipLicense as SponsorshipLicense,
} from "@medialane/sdk";

type OffersQuery = Parameters<typeof ui.useSponsorshipOffers>[0];
type ProposalsQuery = Parameters<typeof ui.useSponsorshipProposals>[0];
type LicensesQuery = Parameters<typeof ui.useSponsorshipLicenses>[0];

export const useSponsorshipOffers = (params?: OffersQuery) => ui.useSponsorshipOffers(params);
export const useSponsorshipBids = (offerId: string | null) => ui.useSponsorshipBids(offerId);
export const useSponsorshipProposals = (params?: ProposalsQuery) => ui.useSponsorshipProposals(params);
export const usePendingProposalsForAsset = (nftContract: string | null) =>
  ui.usePendingProposalsForAsset(nftContract);
export const useSponsorshipLicenses = (params?: LicensesQuery) => ui.useSponsorshipLicenses(params);
export const useMySponsorshipDealCounts = (walletAddress: string | null) =>
  ui.useMySponsorshipDealCounts(walletAddress);
