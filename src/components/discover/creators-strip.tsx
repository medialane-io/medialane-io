"use client";

import { DiscoverCreatorsStrip, useCreators } from "@medialane/ui";


import type { ApiCreatorProfile } from "@medialane/sdk";
import { profileHref } from "@/lib/routes";

export function CreatorsStrip() {
  const { creators, isLoading } = useCreators(undefined, 1, 10);

  return (
    <DiscoverCreatorsStrip
      creators={creators}
      isLoading={isLoading}
      getHref={(c: ApiCreatorProfile) => profileHref({ username: c.username, address: c.walletAddress })}
      allCreatorsHref="/creators"
    />
  );
}
