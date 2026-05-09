"use client";

import { useState } from "react";
import { useMarketplace } from "@/hooks/use-marketplace";
import type { ApiOrder } from "@medialane/sdk";

interface UseOrderActionsOptions {
  mutateListings: () => void;
  /** Force a specific token standard for cancel/accept (e.g. "ERC1155"). Falls back to the order's NFT item type (consideration.itemType for bids, offer.itemType for listings). */
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
  const [acceptStep, setAcceptStep] = useState<"idle" | "processing" | "success" | "error">("idle");
  const [acceptError, setAcceptError] = useState<string | null>(null);
  const [acceptTxHash, setAcceptTxHash] = useState<string | null>(null);

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
      const orderNftStandard = orderToCancel.offer.itemType === "ERC20"
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

  const handleAcceptClick = (order: ApiOrder) => {
    setOrderToAccept(order);
    setAcceptPinOpen(true);
  };

  const handleAcceptPin = async (pin: string) => {
    setAcceptPinOpen(false);
    if (!orderToAccept) return;
    setAcceptStep("processing");
    setAcceptError(null);
    try {
      const orderNftStandard = orderToAccept.offer.itemType === "ERC20"
        ? orderToAccept.consideration.itemType
        : orderToAccept.offer.itemType;
      const txHash = await fulfillOrder({
        orderHash: orderToAccept.orderHash,
        pin,
        tokenStandard: tokenStandard ?? orderNftStandard,
      });
      if (!txHash) throw new Error("Purchase failed — check your portfolio");
      setAcceptTxHash(txHash);
      setAcceptStep("success");
      mutateListings();
    } catch (err) {
      setAcceptStep("error");
      setAcceptError(err instanceof Error ? err.message : "Acceptance failed");
    }
  };

  return {
    isProcessing,
    orderToCancel,
    cancelPinOpen,
    cancelStep,
    cancelError,
    orderToAccept,
    acceptPinOpen,
    acceptStep,
    acceptError,
    acceptTxHash,
    handleCancelClick,
    handleCancelPin,
    handleAcceptClick,
    handleAcceptPin,
    dismissCancelPin: () => { setCancelPinOpen(false); setOrderToCancel(null); },
    dismissAcceptPin: () => { setAcceptPinOpen(false); setOrderToAccept(null); },
    resetCancelStep: () => { setCancelStep("idle"); setCancelError(null); },
    resetAcceptStep: () => { setAcceptStep("idle"); setAcceptError(null); setAcceptTxHash(null); setOrderToAccept(null); },
  };
}
