"use client";

import { CollectionCreateForm, SINGLE_PRESET } from "@medialane/ui";
import { CreateAside } from "@medialane/ui/create-aside";

export default function LaunchpadCreateCollectionPage() {
  return <CollectionCreateForm preset={SINGLE_PRESET} aside={<CreateAside kind="collection" />} />;
}
