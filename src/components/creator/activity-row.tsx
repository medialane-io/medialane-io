"use client";

import { ActivityTimelineRow, type ActivityTimelineRowProps } from "@medialane/ui";
import { assetHref } from "@/lib/routes";

type Props = Omit<ActivityTimelineRowProps, "getAssetHref">;

export function ActivityRow(props: Props) {
  return (
    <ActivityTimelineRow
      {...props}
      getAssetHref={(contract, tokenId) => assetHref("STARKNET", contract, tokenId)}
    />
  );
}
