"use client";

import {
  usePopCollections as usePopCollectionsBase,
  useMyPopEvents,
  usePopClaimStatus as usePopClaimStatusBase,
} from "@medialane/ui";
import { getMedialaneClient } from "@/lib/medialane-client";

export const usePopCollections = () => usePopCollectionsBase(getMedialaneClient);
export const useMyEvents = (owner: string | null) => useMyPopEvents(getMedialaneClient, owner);
export const usePopClaimStatus = (collection: string | null, wallet: string | null) =>
  usePopClaimStatusBase(getMedialaneClient, collection, wallet);
