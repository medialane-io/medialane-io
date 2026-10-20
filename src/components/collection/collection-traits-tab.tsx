"use client";

import { CollectionTraitsTab as CollectionTraitsTabBase } from "@medialane/ui";

export function CollectionTraitsTab({ contract }: { contract: string }) {
  return <CollectionTraitsTabBase contract={contract} />;
}
