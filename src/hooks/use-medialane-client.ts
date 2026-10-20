"use client";

import { useMedialaneClient as useMedialaneClientBase } from "@medialane/ui";
import type { MedialaneClient } from "@medialane/sdk/starknet";

export function useMedialaneClient(): MedialaneClient {
  return useMedialaneClientBase();
}
