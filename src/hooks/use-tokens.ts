"use client";

import { useTokensByOwner as useTokensByOwnerBase } from "@medialane/ui";

export const useTokensByOwner = (address: string | null, page = 1, limit = 20) =>
  useTokensByOwnerBase(address, page, limit, 60_000);
