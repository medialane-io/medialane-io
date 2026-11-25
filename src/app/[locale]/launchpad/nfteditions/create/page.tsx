"use client";

import { CollectionCreateForm, EDITIONS_PRESET } from "@medialane/ui";
import { CreateAside } from "@medialane/ui/create-aside";

export default function CreateIP1155CollectionPage() {
  return <CollectionCreateForm preset={EDITIONS_PRESET} aside={<CreateAside kind="editions" />} />;
}
