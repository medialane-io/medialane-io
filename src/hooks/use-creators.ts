"use client";

import { useCreators as useCreatorsBase } from "@medialane/ui";
import { getMedialaneClient } from "@/lib/medialane-client";

export function useCreators(search?: string, page = 1, limit = 20) {
  return useCreatorsBase(getMedialaneClient, search, page, limit);
}
