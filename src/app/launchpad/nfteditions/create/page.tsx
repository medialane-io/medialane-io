"use client";

import { CollectionCreateForm, EDITIONS_PRESET } from "@medialane/ui";
import { CreateEditionsAside } from "@/components/claim/create-editions-aside";

export default function CreateIP1155CollectionPage() {
  return <CollectionCreateForm preset={EDITIONS_PRESET} aside={<CreateEditionsAside />} />;
}
