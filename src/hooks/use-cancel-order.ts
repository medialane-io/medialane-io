"use client";

import { useState } from "react";
import type { ApiOrder } from "@medialane/sdk";
import { useMarketplaceTransaction } from "@/hooks/use-marketplace-transaction";
import { cancelOrder } from "@/lib/marketplace-intents";
import { orderNftStandard } from "@/lib/protocol/token-standard";

interface UseCancelOrderOptions {
  onSuccess?: () => void;
  /** Overrides the NFT standard read from the order. */
  tokenStandard?: string;
}

export function useCancelOrder({ onSuccess, tokenStandard }: UseCancelOrderOptions) {
  const tx = useMarketplaceTransaction();
  const [order, setOrder] = useState<ApiOrder | null>(null);

  const select = (next: ApiOrder) => {
    tx.reset();
    setOrder(next);
  };

  const confirm = () => {
    if (!order) return;
    const target = order;
    void tx
      .start((ctx) => cancelOrder(ctx, {
        orderHash: target.orderHash,
        tokenStandard: tokenStandard ?? orderNftStandard(target),
      }))
      .then((ok) => { if (ok) onSuccess?.(); });
  };

  const dismiss = () => {
    if (tx.busy) return;
    tx.reset();
    setOrder(null);
  };

  return {
    order,
    select,
    confirm,
    dismiss,
    phase: tx.phase,
    busy: tx.busy,
    txHash: tx.txHash,
    error: tx.error,
    retryable: tx.retryable,
  };
}

export type CancelOrderHook = ReturnType<typeof useCancelOrder>;
