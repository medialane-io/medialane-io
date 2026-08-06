"use client";

import { useState } from "react";
import { useMarketplace } from "@/hooks/use-marketplace";
import type { ApiOrder } from "@medialane/sdk";

interface UseOrderActionsOptions {
  mutateListings: () => void;
  /** Force a specific token standard for cancel (e.g. "ERC1155"). Falls back to the order's NFT item type. */
  tokenStandard?: string;
}

export function useOrderActions({ mutateListings, tokenStandard }: UseOrderActionsOptions) {
  const { cancelOrder, isProcessing } = useMarketplace();

  const [orderToCancel, setOrderToCancel] = useState<ApiOrder | null>(null);
  const [cancelStep, setCancelStep] = useState<"idle" | "processing" | "success" | "error">("idle");
  const [cancelError, setCancelError] = useState<string | null>(null);

  const handleCancelClick = async (order: ApiOrder) => {
    setOrderToCancel(order);
    setCancelStep("processing");
    setCancelError(null);
    try {
      // For bid orders, offer.itemType is "ERC20" and the NFT standard is in consideration.itemType
      const orderNftStandard =
        order.offer.itemType === "ERC20"
          ? order.consideration.itemType
          : order.offer.itemType;
      await cancelOrder({
        orderHash: order.orderHash,
        tokenStandard: tokenStandard ?? orderNftStandard,
      });
      setCancelStep("success");
      mutateListings();
    } catch (err: unknown) {
      setCancelStep("error");
      setCancelError(err instanceof Error ? err.message : "Cancellation failed");
    }
  };

  return {
    isProcessing,
    orderToCancel,
    cancelStep,
    cancelError,
    handleCancelClick,
    resetCancelStep: () => {
      setCancelStep("idle");
      setCancelError(null);
    },
  };
}
