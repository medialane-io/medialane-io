"use client";

import { ArrowDownUp } from "lucide-react";
import type { ApiOrder } from "@medialane/sdk";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

export type OrderSort = "recent" | "price_asc" | "price_desc";

const LABELS: Record<OrderSort, string> = {
  recent: "Recently listed",
  price_asc: "Price: low to high",
  price_desc: "Price: high to low",
};

/** Pure — orders already come from the API sorted "recent"; this only
 *  re-sorts the in-memory page by price.raw (BigInt-safe wei comparison). */
export function sortOrders(orders: ApiOrder[], sort: OrderSort): ApiOrder[] {
  if (sort === "recent") return orders;
  const withPrice = orders.filter((o) => o.price.raw != null);
  const withoutPrice = orders.filter((o) => o.price.raw == null);
  const sorted = [...withPrice].sort((a, b) => {
    const diff = BigInt(a.price.raw!) - BigInt(b.price.raw!);
    return sort === "price_asc" ? (diff < 0n ? -1 : diff > 0n ? 1 : 0) : (diff > 0n ? -1 : diff < 0n ? 1 : 0);
  });
  return [...sorted, ...withoutPrice];
}

export function OrderSortControl({ value, onChange }: { value: OrderSort; onChange: (v: OrderSort) => void }) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as OrderSort)}>
      <SelectTrigger className="w-[180px] h-9 text-xs gap-1.5">
        <ArrowDownUp className="h-3.5 w-3.5 text-muted-foreground" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {(Object.keys(LABELS) as OrderSort[]).map((k) => (
          <SelectItem key={k} value={k} className="text-xs">{LABELS[k]}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
