"use client";

import { uploadJsonToIpfs } from "@medialane/ui";

export async function pinLaunchpadMetadata(metadata: Record<string, unknown>): Promise<string> {
  return uploadJsonToIpfs(metadata);
}

export async function pinSponsorshipTerms(metadata: Record<string, unknown>): Promise<string> {
  return uploadJsonToIpfs(metadata);
}
