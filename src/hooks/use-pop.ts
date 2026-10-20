"use client";

import {
  usePopCollections as usePopCollectionsBase,
  useMyPopEvents,
  usePopClaimStatus as usePopClaimStatusBase,
} from "@medialane/ui";

export const usePopCollections = () => usePopCollectionsBase();
export const useMyEvents = (owner: string | null) => useMyPopEvents(owner);
export const usePopClaimStatus = (collection: string | null, wallet: string | null) =>
  usePopClaimStatusBase(collection, wallet);
