"use client";

import { CollectionCreateForm, TICKETS_PRESET } from "@medialane/ui";
import { PageAside } from "@medialane/ui/page-aside";

export default function CreateTicketCollectionPage() {
  return <CollectionCreateForm preset={TICKETS_PRESET} aside={<PageAside kind="tickets" />} />;
}
