"use client";

import dynamic from "next/dynamic";

export const CreatorAnalytics = dynamic(
  () => import("@medialane/ui/creator-analytics").then((m) => m.CreatorAnalytics),
  {
    ssr: false,
    loading: () => <div className="h-64 w-full animate-pulse rounded-xl bg-muted/40" />,
  },
);
