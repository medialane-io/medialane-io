"use client";

import { DiscoverCreatorsStrip } from "@medialane/ui";
import { useCreators } from "@/hooks/use-creators";
import type { ApiCreatorProfile } from "@medialane/sdk";

export function CreatorsStrip() {
  const { creators, isLoading } = useCreators(undefined, 1, 10);

  return (
    <DiscoverCreatorsStrip
      creators={creators}
      isLoading={isLoading}
      getHref={(c: ApiCreatorProfile) => `/creator/${c.username}`}
      allCreatorsHref="/creators"
    />
  );
}
