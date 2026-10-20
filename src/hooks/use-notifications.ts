"use client";

import { useNotifications as useNotificationsBase } from "@medialane/ui";

export function useNotifications(address: string | null | undefined) {
  return useNotificationsBase(address);
}
