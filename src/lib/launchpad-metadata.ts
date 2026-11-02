"use client";

import { uploadJsonToIpfs } from "@medialane/ui";
import { getMedialaneClient } from "@/lib/medialane-client";

export async function pinLaunchpadMetadata(metadata: object): Promise<string> {
  return uploadJsonToIpfs(getMedialaneClient().api, metadata);
}
