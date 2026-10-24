"use client";

import { CollectionCreateForm, CLUB_PRESET } from "@medialane/ui";
import { CreateClubAside } from "@/components/claim/create-club-aside";

export default function CreateClubPage() {
  return <CollectionCreateForm preset={CLUB_PRESET} aside={<CreateClubAside />} />;
}
