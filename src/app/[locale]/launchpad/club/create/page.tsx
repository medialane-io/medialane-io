"use client";

import { CollectionCreateForm, CLUB_PRESET } from "@medialane/ui";
import { CreateAside } from "@medialane/ui/create-aside";

export default function CreateClubPage() {
  return <CollectionCreateForm preset={CLUB_PRESET} aside={<CreateAside kind="club" />} />;
}
