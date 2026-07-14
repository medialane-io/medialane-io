"use client";

import { LaunchpadStrip } from "@medialane/ui";

export function AirdropSection() {
  return (
    <LaunchpadStrip
      hrefs={{
        "nfts": "/launchpad/single-editions",
        "limited-editions": "/launchpad/nfteditions",
        "collection-drop": "/launchpad/drop",
        "pop-protocol": "/launchpad/pop",
        "ip-tickets": "/launchpad/tickets",
        "creator-coins": "/launchpad/coin/create",
      }}
      marketplaceHref="/marketplace"
      launchpadHref="/launchpad"
    />
  );
}
