"use client";

import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { ApiActivity } from "@medialane/sdk";
import { TrendingUp, ShoppingBag, Coins } from "lucide-react";

interface CreatorAnalyticsProps {
  activities: ApiActivity[];
  isLoading: boolean;
}

interface DayStat {
  label: string;
  volume: number;
}

function parsePrice(formatted: string | null | undefined): number {
  if (!formatted) return 0;
  return parseFloat(formatted.replace(/[^0-9.]/g, "")) || 0;
}

function buildDailyVolume(sales: ApiActivity[]): DayStat[] {
  const buckets = new Map<string, number>();
  const now = Date.now();
  // Pre-fill last 30 days so chart always shows full range
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now - i * 86_400_000);
    buckets.set(
      d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      0
    );
  }
  for (const s of sales) {
    const ts =
      typeof s.timestamp === "number"
        ? s.timestamp * 1000
        : new Date(s.timestamp).getTime();
    if (now - ts > 30 * 86_400_000) continue;
    const label = new Date(ts).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    buckets.set(label, (buckets.get(label) ?? 0) + parsePrice(s.price?.formatted));
  }
  return Array.from(buckets.entries()).map(([label, volume]) => ({ label, volume }));
}

export function CreatorAnalytics({ activities, isLoading }: CreatorAnalyticsProps) {
  const { sales, totalVolume, topCurrency, dailyVolume } = useMemo(() => {
    const sales = activities.filter((a) => a.type === "sale");

    // Volume per currency
    const byCurrency = new Map<string, number>();
    for (const s of sales) {
      const cur = s.price?.currency ?? "STRK";
      byCurrency.set(cur, (byCurrency.get(cur) ?? 0) + parsePrice(s.price?.formatted));
    }
    const sorted = [...byCurrency.entries()].sort((a, b) => b[1] - a[1]);
    const topCurrency = sorted[0]?.[0] ?? "STRK";
    const totalVolume = sorted[0]?.[1] ?? 0;

    const dailyVolume = buildDailyVolume(
      sales.filter((s) => (s.price?.currency ?? "STRK") === topCurrency)
    );

    return { sales, totalVolume, topCurrency, dailyVolume };
  }, [activities]);

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 rounded-xl bg-muted" />
        ))}
      </div>
    );
  }

  if (sales.length === 0) {
    return (
      <div className="py-12 text-center text-sm text-muted-foreground">
        No sales recorded yet.
      </div>
    );
  }

  const stats = [
    {
      label: "Total Sales",
      value: sales.length.toString(),
      icon: ShoppingBag,
    },
    {
      label: `Total Volume (${topCurrency})`,
      value: totalVolume.toFixed(2),
      icon: Coins,
    },
    {
      label: "Last 30 Days",
      value: `${dailyVolume.filter((d) => d.volume > 0).length} active days`,
      icon: TrendingUp,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {stats.map(({ label, value, icon: Icon }) => (
          <div
            key={label}
            className="rounded-xl border border-border bg-card/50 p-4 space-y-1"
          >
            <div className="flex items-center gap-2 text-muted-foreground">
              <Icon className="h-3.5 w-3.5" />
              <p className="text-xs font-medium uppercase tracking-wide">{label}</p>
            </div>
            <p className="text-2xl font-bold tabular-nums">{value}</p>
          </div>
        ))}
      </div>

      {/* 30-day volume chart */}
      <div className="rounded-xl border border-border bg-card/50 p-4 space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          30-day volume · {topCurrency}
        </p>
        <ResponsiveContainer width="100%" height={140}>
          <BarChart
            data={dailyVolume}
            margin={{ top: 4, right: 4, bottom: 0, left: 0 }}
          >
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
              interval={6}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
              width={40}
            />
            <Tooltip
              contentStyle={{
                background: "hsl(var(--background))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                fontSize: "12px",
                color: "hsl(var(--foreground))",
              }}
              formatter={(value) => [`${value} ${topCurrency}`, "Volume"]}
            />
            <Bar
              dataKey="volume"
              fill="hsl(var(--primary))"
              radius={[3, 3, 0, 0]}
              maxBarSize={24}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
