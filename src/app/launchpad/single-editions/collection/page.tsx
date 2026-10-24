"use client";

import { CollectionCreateForm, SINGLE_PRESET } from "@medialane/ui";
import { CreateCollectionAside } from "@/components/claim/create-collection-aside";

export default function LaunchpadCreateCollectionPage() {
  return <CollectionCreateForm preset={SINGLE_PRESET} aside={<CreateCollectionAside />} />;
}
