"use client";

import { CollectionActivityTab as CollectionActivityTabBase } from "@medialane/ui";

export function CollectionActivityTab({ contract }: { contract: string }) {
  return <CollectionActivityTabBase contract={contract} />;
}
