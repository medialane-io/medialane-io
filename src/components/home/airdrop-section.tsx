"use client";

import { LaunchpadStrip } from "@medialane/ui";

export function AirdropSection() {
  return (
    <LaunchpadStrip
      hrefs={{
        "nfts": "/launchpad/nfts",
        "limited-editions": "/launchpad/nfteditions",
        "collection-drop": "/launchpad/drop",
        "pop-protocol": "/launchpad/pop",
        "creator-coins": "/launchpad/coin/create",
      }}
      marketplaceHref="/marketplace"
      launchpadHref="/launchpad"
    />
  );
}
