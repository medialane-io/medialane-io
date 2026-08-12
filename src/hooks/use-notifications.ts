"use client";

import { useNotifications as useNotificationsBase } from "@medialane/ui";
import { getMedialaneClient } from "@/lib/medialane-client";
import { MEDIALANE_BACKEND_URL, MEDIALANE_API_KEY } from "@/lib/constants";

const apiConfig = { baseUrl: MEDIALANE_BACKEND_URL, apiKey: MEDIALANE_API_KEY };

export function useNotifications(address: string | null | undefined) {
  return useNotificationsBase(getMedialaneClient, apiConfig, address);
}
