"use client";

import { ActivityRow as ActivityRowBase, type ActivityRowProps as BaseProps } from "@medialane/ui";
import { EXPLORER_URL } from "@/lib/constants";

type ActivityRowProps = Omit<BaseProps, "explorerUrl">;

export function ActivityRow(props: ActivityRowProps) {
  return (
    <ActivityRowBase
      {...props}
      explorerUrl={EXPLORER_URL}
    />
  );
}
