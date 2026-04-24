"use client";

import { useState } from "react";
import { useMarketplace } from "@/hooks/use-marketplace";
import type { ApiOrder } from "@medialane/sdk";

interface UseOrderActionsOptions {
  mutateListings: () => void;
  /** Force a specific token standard for cancel/accept (e.g. "ERC1155"). Falls back to order.offer.itemType when omitted. */
  tokenStandard?: string;
}

export function useOrderActions({ mutateListings, tokenStandard }: UseOrderActionsOptions) {
  const { cancelOrder, fulfillOrder, isProcessing } = useMarketplace();

  const [orderToCancel, setOrderToCancel] = useState<ApiOrder | null>(null);
  const [cancelPinOpen, setCancelPinOpen] = useState(false);
  const [cancelStep, setCancelStep] = useState<"idle" | "processing" | "success" | "error">("idle");
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [orderToAccept, setOrderToAccept] = useState<ApiOrder | null>(null);
  const [acceptPinOpen, setAcceptPinOpen] = useState(false);

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
      await cancelOrder({
        orderHash: orderToCancel.orderHash,
        pin,
        tokenStandard: tokenStandard ?? orderToCancel.offer.itemType,
      });
      setCancelStep("success");
      mutateListings();
    } catch (err: unknown) {
      setCancelStep("error");
      setCancelError(err instanceof Error ? err.message : "Cancellation failed");
    }
  };

  const handleAcceptClick = (order: ApiOrder) => {
    setOrderToAccept(order);
    setAcceptPinOpen(true);
  };

  const handleAcceptPin = async (pin: string) => {
    setAcceptPinOpen(false);
    if (!orderToAccept) return;
    await fulfillOrder({
      orderHash: orderToAccept.orderHash,
      pin,
      tokenStandard: tokenStandard ?? orderToAccept.offer.itemType,
    });
    setOrderToAccept(null);
    mutateListings();
  };

  return {
    isProcessing,
    orderToCancel,
    cancelPinOpen,
    cancelStep,
    cancelError,
    orderToAccept,
    acceptPinOpen,
    handleCancelClick,
    handleCancelPin,
    handleAcceptClick,
    handleAcceptPin,
    dismissCancelPin: () => { setCancelPinOpen(false); setOrderToCancel(null); },
    dismissAcceptPin: () => { setAcceptPinOpen(false); setOrderToAccept(null); },
    resetCancelStep: () => { setCancelStep("idle"); setCancelError(null); },
  };
}
