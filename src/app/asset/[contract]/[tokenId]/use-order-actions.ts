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
  const [cancelPinOpen, setCancelPinOpen] = useState(false);
  const [cancelStep, setCancelStep] = useState<"idle" | "processing" | "success" | "error">("idle");
  const [cancelError, setCancelError] = useState<string | null>(null);

  const handleCancelClick = (order: ApiOrder) => {
    setOrderToCancel(order);
    setCancelPinOpen(true);
  };

  const handleCancelPin = async (pin: string) => {
    setCancelPinOpen(false);
    if (!orderToCancel) return;
    setCancelStep("processing");
    setCancelError(null);
    try {
      // For bid orders, offer.itemType is "ERC20" and the NFT standard is in consideration.itemType
      const orderNftStandard =
        orderToCancel.offer.itemType === "ERC20"
          ? orderToCancel.consideration.itemType
          : orderToCancel.offer.itemType;
      await cancelOrder({
        orderHash: orderToCancel.orderHash,
        pin,
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
    cancelPinOpen,
    cancelStep,
    cancelError,
    handleCancelClick,
    handleCancelPin,
    dismissCancelPin: () => {
      setCancelPinOpen(false);
      setOrderToCancel(null);
    },
    resetCancelStep: () => {
      setCancelStep("idle");
      setCancelError(null);
    },
  };
}
