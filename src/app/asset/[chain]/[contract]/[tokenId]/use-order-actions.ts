"use client";

import { useState } from "react";
import { useMarketplace } from "@/hooks/use-marketplace";
import { useWalletUnlock } from "@/hooks/use-wallet-unlock";
import type { ApiOrder } from "@medialane/sdk";

interface UseOrderActionsOptions {
  mutateListings: () => void;
  /** Force a specific token standard for cancel (e.g. "ERC1155"). Falls back to the order's NFT item type. */
  tokenStandard?: string;
}

export function useOrderActions({ mutateListings, tokenStandard }: UseOrderActionsOptions) {
  const { cancelOrder, isProcessing } = useMarketplace();
  // Unlocks with the wallet's own method — passkey (no dialog) or PIN.
  const { unlock, pinDialogProps } = useWalletUnlock();

  const [orderToCancel, setOrderToCancel] = useState<ApiOrder | null>(null);
  const [cancelStep, setCancelStep] = useState<"idle" | "processing" | "success" | "error">("idle");
  const [cancelError, setCancelError] = useState<string | null>(null);

  // `secret` is the wallet-unlock material — a typed PIN or the passkey key.
  const runCancel = async (order: ApiOrder, secret: string) => {
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
        pin: secret,
        tokenStandard: tokenStandard ?? orderNftStandard,
      });
      setCancelStep("success");
      mutateListings();
    } catch (err: unknown) {
      setCancelStep("error");
      setCancelError(err instanceof Error ? err.message : "Cancellation failed");
    }
  };

  const handleCancelClick = (order: ApiOrder) => {
    setOrderToCancel(order);
    // `unlock` can throw before runCancel executes (e.g. a passkey-only wallet
    // whose passkey is unavailable here) — surface it in the cancel result state.
    void (async () => {
      try {
        await unlock((secret) => runCancel(order, secret));
      } catch (err: unknown) {
        setCancelStep("error");
        setCancelError(err instanceof Error ? err.message : "Could not unlock your wallet");
      }
    })();
  };

  return {
    isProcessing,
    orderToCancel,
    // Same public shape as before — now backed by the passkey-or-PIN unlock
    // hook, so consumers need no changes and passkey users skip the dialog.
    cancelPinOpen: pinDialogProps.open,
    cancelStep,
    cancelError,
    handleCancelClick,
    handleCancelPin: pinDialogProps.onSubmit,
    dismissCancelPin: () => {
      pinDialogProps.onCancel();
      setOrderToCancel(null);
    },
    resetCancelStep: () => {
      setCancelStep("idle");
      setCancelError(null);
    },
  };
}
