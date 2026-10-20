"use client";

import { useCreators as useCreatorsBase } from "@medialane/ui";

export function useCreators(search?: string, page = 1, limit = 20) {
  return useCreatorsBase(search, page, limit);
}
