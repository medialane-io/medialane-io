"use client";

import { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import type { ApiActivity } from "@medialane/sdk";

interface PriceHistoryChartProps {
  history: ApiActivity[];
}

function parsePrice(formatted: string): number {
  return parseFloat(formatted.replace(/[^0-9.]/g, "")) || 0;
}

export function PriceHistoryChart({ history }: PriceHistoryChartProps) {
  const chartData = useMemo(() => {
    const sales = history.filter(
      (e) => e.type === "sale" && e.price?.formatted != null
    );
    if (sales.length < 2) return null;

    // Pick most common currency to keep Y-axis consistent
    const currencyCounts = new Map<string, number>();
    for (const s of sales) {
      const c = s.price!.currency ?? "STRK";
      currencyCounts.set(c, (currencyCounts.get(c) ?? 0) + 1);
    }
    const topCurrency = [...currencyCounts.entries()].sort(
      (a, b) => b[1] - a[1]
    )[0][0];

    const points = sales
      .filter((s) => (s.price!.currency ?? "STRK") === topCurrency)
      .map((s) => ({
        date: new Date(
          typeof s.timestamp === "number" ? s.timestamp * 1000 : s.timestamp
        ).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        price: parsePrice(s.price!.formatted ?? ""),
      }))
      .reverse(); // oldest → newest left to right

    if (points.length < 2) return null;
    return { currency: topCurrency, points };
  }, [history]);

  if (!chartData) {
    return (
      <p className="text-sm text-muted-foreground py-4 text-center">
        Not enough sales data to show price history.
      </p>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card/50 p-4 space-y-2">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        Price history · {chartData.currency}
      </p>
      <ResponsiveContainer width="100%" height={160}>
        <LineChart
          data={chartData.points}
          margin={{ top: 4, right: 8, bottom: 0, left: 0 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="hsl(var(--border))"
            opacity={0.5}
          />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            axisLine={false}
            tickLine={false}
            width={48}
          />
          <Tooltip
            contentStyle={{
              background: "hsl(var(--background))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
              fontSize: "12px",
              color: "hsl(var(--foreground))",
            }}
            formatter={(value) => [
              `${value} ${chartData.currency}`,
              "Sale price",
            ]}
          />
          <Line
            type="monotone"
            dataKey="price"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            dot={{ fill: "hsl(var(--primary))", r: 3, strokeWidth: 0 }}
            activeDot={{ r: 5, fill: "hsl(var(--primary))" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
