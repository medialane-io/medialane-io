"use client";

import { LaunchpadPage } from "@medialane/ui";
import { FastMint } from "@/components/launchpad/fast-mint";
import { SHARED_CLAIM_KEYS } from "@/lib/claims";

export function LaunchpadContent() {
  return <LaunchpadPage fastMint={<FastMint />} hideGroups={["claims"]} excludeKeys={[...SHARED_CLAIM_KEYS]} />;
}
