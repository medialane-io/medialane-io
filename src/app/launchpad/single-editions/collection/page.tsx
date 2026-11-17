"use client";

import { CollectionCreateForm, SINGLE_PRESET } from "@medialane/ui";
import { PageAside } from "@/components/claim/page-aside";

export default function LaunchpadCreateCollectionPage() {
  return <CollectionCreateForm preset={SINGLE_PRESET} aside={<PageAside kind="collection" />} />;
}
