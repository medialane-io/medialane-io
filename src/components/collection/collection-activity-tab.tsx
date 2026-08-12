"use client";

import { CollectionActivityTab as CollectionActivityTabBase } from "@medialane/ui";
import { getMedialaneClient } from "@/lib/medialane-client";

export function CollectionActivityTab({ contract }: { contract: string }) {
  return <CollectionActivityTabBase getClient={getMedialaneClient} contract={contract} />;
}
