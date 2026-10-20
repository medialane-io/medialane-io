"use client";

import { useActivities as useActivitiesBase, useActivitiesByAddress as useActivitiesByAddressBase } from "@medialane/ui";
import type { ApiActivitiesQuery } from "@medialane/sdk";

export function useActivities(query: ApiActivitiesQuery = {}) {
  return useActivitiesBase(query);
}

export function useActivitiesByAddress(address: string | null) {
  return useActivitiesByAddressBase(address);
}
