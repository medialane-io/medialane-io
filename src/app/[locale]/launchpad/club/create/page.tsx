"use client";

import { CollectionCreateForm, CLUB_PRESET } from "@medialane/ui";
import { PageAside } from "@medialane/ui/page-aside";

export default function CreateClubPage() {
  return <CollectionCreateForm preset={CLUB_PRESET} aside={<PageAside kind="club" />} />;
}
