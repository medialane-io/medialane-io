"use client";

import { useTokensByIpType as useTokensByIpTypeBase } from "@medialane/ui";

export const useTokensByIpType = (ipTypeSlug: string | null, page = 1, limit = 24) =>
  useTokensByIpTypeBase(ipTypeSlug, page, limit);
