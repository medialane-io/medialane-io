"use client";

import { useState } from "react";
import { useMarketplaceTransaction } from "@/hooks/use-marketplace-transaction";
import { fulfillOrder } from "@/lib/marketplace-intents";
import { orderNftStandard } from "@/lib/protocol/token-standard";
import { useTokenBalance, hasSufficientBalance } from "@medialane/ui/utils/media-wallet/use-erc20-balance";
import type { ApiOrder } from "@medialane/sdk";

interface UseAcceptOfferOptions {
  mutateListings: () => void;

  tokenStandard?: string;

  activeListings?: ApiOrder[];
}

export function useAcceptOffer({ mutateListings, tokenStandard, activeListings = [] }: UseAcceptOfferOptions) {
  const tx = useMarketplaceTransaction();

  const [selectedOrder, setSelectedOrder] = useState<ApiOrder | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [warningOpen, setWarningOpen] = useState(false);
  const [pendingOrder, setPendingOrder] = useState<ApiOrder | null>(null);

  const { rawBalance, decimals } = useTokenBalance(selectedOrder?.price.currency ?? null,
    selectedOrder?.offerer ?? null
  );
  const buyerHasFunds = selectedOrder
    ? hasSufficientBalance(rawBalance, selectedOrder.price.formatted ?? "", decimals)
    : null;

  const accept = async (order: ApiOrder) => {
    const ok = await tx.start((ctx) => fulfillOrder(ctx, {
      orderHash: order.orderHash,
      tokenStandard: tokenStandard ?? orderNftStandard(order),
    }));
    if (ok) mutateListings();
  };

  const handleAcceptClick = (order: ApiOrder) => {
    setSelectedOrder(order);
    tx.reset();
    if (activeListings.length > 0) {
      setPendingOrder(order);
      setWarningOpen(true);
      return;
    }
    setConfirmOpen(true);
  };

  const confirmAccept = () => {
    setConfirmOpen(false);
    if (selectedOrder) void accept(selectedOrder);
  };

  const proceedFromWarning = () => {
    setWarningOpen(false);
    if (!pendingOrder) return;
    void accept(pendingOrder);
  };

  const dismissWarning = () => {
    setWarningOpen(false);
    setPendingOrder(null);
    setSelectedOrder(null);
  };

  const dismiss = () => {
    if (tx.busy) return;
    tx.reset();
    setSelectedOrder(null);
    setConfirmOpen(false);
    setWarningOpen(false);
    setPendingOrder(null);
  };

  return {
    isOpen: warningOpen || confirmOpen || tx.phase !== "idle",
    selectedOrder,
    buyerHasFunds,
    phase: tx.phase,
    busy: tx.busy,
    txHash: tx.txHash,
    error: tx.error,
    retryable: tx.retryable,
    failedAfterSubmit: tx.failedAfterSubmit,
    handleAcceptClick,
    confirmAccept,
    dismiss,

    warningOpen,
    activeListings,
    proceedFromWarning,
    dismissWarning,
  };
}

export type AcceptOfferHook = ReturnType<typeof useAcceptOffer>;
