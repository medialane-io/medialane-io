"use client";

import { use } from "react";
import { CollectionSettings } from "@medialane/ui";

export default function CollectionSettingsPage({ params }: { params: Promise<{ contract: string }> }) {
  const { contract } = use(params);
  return <CollectionSettings contract={contract} />;
}
