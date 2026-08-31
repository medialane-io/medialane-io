"use client";

import dynamic from "next/dynamic";

export const PriceHistoryChart = dynamic(
  () => import("@medialane/ui/price-history-chart").then((m) => m.PriceHistoryChart),
  {
    ssr: false,
    loading: () => <div className="h-48 w-full animate-pulse rounded-xl bg-muted/40" />,
  },
);
