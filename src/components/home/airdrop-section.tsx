"use client";

import { LaunchpadStrip } from "@medialane/ui";

export function AirdropSection() {
  return (
    <LaunchpadStrip
      hrefs={{
        "mint-ip-asset": "/create/asset",
        "create-collection": "/create/collection",
        "ip-collection-1155": "/launchpad/nfteditions/create",
        "mint-editions": "/launchpad/nfteditions",
        "collection-drop": "/launchpad/drop/create",
        "pop-protocol": "/launchpad/pop/create",
      }}
      marketplaceHref="/marketplace"
      launchpadHref="/launchpad"
    />
  );
}
