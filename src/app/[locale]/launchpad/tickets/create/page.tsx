"use client";

import { CollectionCreateForm, TICKETS_PRESET } from "@medialane/ui";
import { PageAside } from "@/components/claim/page-aside";

export default function CreateTicketCollectionPage() {
  return <CollectionCreateForm preset={TICKETS_PRESET} aside={<PageAside kind="tickets" />} />;
}
