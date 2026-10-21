"use client";

import { CreatorPage } from "@medialane/ui";
import { useAssetActions } from "@/components/portfolio/portfolio-actions";

export default function CreatorUsernamePageClient({ username }: { username: string }) {
  return <CreatorPage username={username} useAssetActions={useAssetActions} />;
}
