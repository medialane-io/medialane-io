"use client";

import { CollectionCreateForm, TICKETS_PRESET } from "@medialane/ui";
import { CreateAside } from "@medialane/ui/create-aside";

export default function CreateTicketCollectionPage() {
  return <CollectionCreateForm preset={TICKETS_PRESET} aside={<CreateAside kind="tickets" />} />;
}
