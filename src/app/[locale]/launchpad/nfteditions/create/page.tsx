"use client";

import { CollectionCreateForm, EDITIONS_PRESET } from "@medialane/ui";
import { PageAside } from "@medialane/ui/page-aside";

export default function CreateIP1155CollectionPage() {
  return <CollectionCreateForm preset={EDITIONS_PRESET} aside={<PageAside kind="editions" />} />;
}
