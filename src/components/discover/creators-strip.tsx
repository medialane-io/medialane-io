"use client";

import { useCreators } from "@/hooks/use-creators";
import { DiscoverCreatorsStrip } from "@medialane/ui";
import type { ApiCreatorProfile } from "@medialane/sdk";

export function CreatorsStrip() {
  const { creators, isLoading } = useCreators(undefined, 1, 10);

  return (
    <DiscoverCreatorsStrip
      creators={creators.map((c) => ({
        ...c,
        bannerImage: c.bannerImage ?? (c as any).collectionImage ?? null,
        avatarImage: c.avatarImage ?? (c as any).collectionImage ?? null,
      }))}
      isLoading={isLoading}
      getHref={(c: ApiCreatorProfile) => `/creator/${c.username}`}
      allCreatorsHref="/creators"
      sectionLabel="Explore"
      title="Creators"
    />
  );
}
