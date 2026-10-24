"use client";

import { CollectionCreateForm, TICKETS_PRESET } from "@medialane/ui";
import { CreateTicketAside } from "@/components/claim/create-ticket-aside";

export default function CreateTicketCollectionPage() {
  return <CollectionCreateForm preset={TICKETS_PRESET} aside={<CreateTicketAside />} />;
}
