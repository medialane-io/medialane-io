"use client";

import { CollectionTraitsTab as CollectionTraitsTabBase } from "@medialane/ui";
import { getMedialaneClient } from "@/lib/medialane-client";

export function CollectionTraitsTab({ contract }: { contract: string }) {
  return <CollectionTraitsTabBase getClient={getMedialaneClient} contract={contract} />;
}
