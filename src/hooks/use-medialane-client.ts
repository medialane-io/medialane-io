"use client";

import { useMemo } from "react";
import { MedialaneClient } from "@medialane/sdk";
import { getMedialaneClient } from "@/lib/medialane-client";

export function useMedialaneClient(): MedialaneClient {
  return useMemo(() => getMedialaneClient(), []);
}
