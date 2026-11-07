"use client";

import { useState } from "react";
import { ListingsGrid as ListingsGridView, type ListingsGridProps } from "@medialane/ui";
import type { ApiOrder } from "@medialane/sdk";
import { PurchaseDialog } from "./purchase-dialog";

export function ListingsGrid(props: Omit<ListingsGridProps, "onBuy">) {
  const [selected, setSelected] = useState<ApiOrder | null>(null);
  return (
    <>
      <ListingsGridView {...props} onBuy={setSelected} />
      {selected && (
        <PurchaseDialog
          order={selected}
          open
          onOpenChange={(open) => {
            if (!open) setSelected(null);
          }}
        />
      )}
    </>
  );
}
