"use client";

import { CreatorChip as CreatorChipBase } from "@medialane/ui";
import { getMedialaneClient } from "@/lib/medialane-client";

export function CreatorChip({ address }: { address: string }) {
  return <CreatorChipBase getClient={getMedialaneClient} address={address} />;
}
