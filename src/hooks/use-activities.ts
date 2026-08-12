"use client";

import { useActivities as useActivitiesBase, useActivitiesByAddress as useActivitiesByAddressBase } from "@medialane/ui";
import { getMedialaneClient } from "@/lib/medialane-client";
import type { ApiActivitiesQuery } from "@medialane/sdk";

export function useActivities(query: ApiActivitiesQuery = {}) {
  return useActivitiesBase(getMedialaneClient, query);
}

export function useActivitiesByAddress(address: string | null) {
  return useActivitiesByAddressBase(getMedialaneClient, address);
}
