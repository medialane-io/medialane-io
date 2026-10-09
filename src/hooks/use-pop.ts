"use client";

import {
  usePopCollections as usePopCollectionsBase,
  useMyPopEvents,
  usePopClaimStatus as usePopClaimStatusBase,
} from "@medialane/ui";
import { getMedialaneClient } from "@/lib/medialane-client";
import { starknetProvider } from "@/lib/starknet";

export const usePopCollections = () => usePopCollectionsBase(getMedialaneClient);
export const useMyEvents = (owner: string | null) => useMyPopEvents(getMedialaneClient, owner);
export const usePopClaimStatus = (collection: string | null, wallet: string | null) =>
  usePopClaimStatusBase(starknetProvider, collection, wallet);
