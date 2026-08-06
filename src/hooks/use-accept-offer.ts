"use client";

import { useState } from "react";
import { useWalletMarketplaceActionFlow } from "@/hooks/use-wallet-marketplace-action-flow";
import { useMarketplace } from "@/hooks/use-marketplace";
import { useTokenBalance, hasSufficientBalance } from "@/hooks/use-erc20-balance";
import { rewardToast } from "@/lib/reward-toast";
import type { ApiOrder } from "@medialane/sdk";

interface UseAcceptOfferOptions {
  mutateListings: () => void;
  /** Force a specific NFT token standard (e.g. "ERC1155"). Falls back to the order's item types. */
  tokenStandard?: string;
  /** Active sell listings for the same token. When non-empty, a warning step is shown before executing. */
  activeListings?: ApiOrder[];
}

export function useAcceptOffer({ mutateListings, tokenStandard, activeListings = [] }: UseAcceptOfferOptions) {
  const { fulfillOrder, hasWallet } = useMarketplace();

  const [selectedOrder, setSelectedOrder] = useState<ApiOrder | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [warningOpen, setWarningOpen] = useState(false);
  const [pendingOrder, setPendingOrder] = useState<ApiOrder | null>(null);

  const { rawBalance, decimals } = useTokenBalance(
    selectedOrder?.price.currency ?? null,
    selectedOrder?.offerer ?? null
  );
  const buyerHasFunds = selectedOrder
    ? hasSufficientBalance(rawBalance, selectedOrder.price.formatted ?? "", decimals)
    : null;

  const actionFlow = useWalletMarketplaceActionFlow<ApiOrder>({
    hasWallet,
    executeAction: async (order) => {
      const nftStandard =
        order.offer.itemType === "ERC20"
          ? order.consideration.itemType
          : order.offer.itemType;
      const hash = await fulfillOrder({
        orderHash: order.orderHash,
        tokenStandard: tokenStandard ?? nftStandard,
      });
      if (!hash) throw new Error("Transaction failed — check your portfolio");
      rewardToast("offer_accepted_seller");
      mutateListings();
    },
  });

  const handleAcceptClick = (order: ApiOrder) => {
    setSelectedOrder(order);
    actionFlow.resetActionFlow();
    if (activeListings.length > 0) {
      setPendingOrder(order);
      setWarningOpen(true);
      return;
    }
    setConfirmOpen(true);
  };

  const confirmAccept = () => {
    setConfirmOpen(false);
    if (selectedOrder) actionFlow.beginAction(selectedOrder);
  };

  const proceedFromWarning = () => {
    setWarningOpen(false);
    if (!pendingOrder) return;
    actionFlow.beginAction(pendingOrder);
  };

  const dismissWarning = () => {
    setWarningOpen(false);
    setPendingOrder(null);
    setSelectedOrder(null);
  };

  const dismiss = () => {
    if (actionFlow.status === "processing" || actionFlow.status === "confirming") return;
    actionFlow.resetActionFlow();
    setSelectedOrder(null);
    setConfirmOpen(false);
    setWarningOpen(false);
    setPendingOrder(null);
  };

  return {
    isOpen: warningOpen || confirmOpen || actionFlow.status !== "idle",
    selectedOrder,
    buyerHasFunds,
    status: actionFlow.status,
    txHash: actionFlow.txHash,
    error: actionFlow.error,
    handleAcceptClick,
    confirmAccept,
    dismiss,
    // Listing warning
    warningOpen,
    activeListings,
    proceedFromWarning,
    dismissWarning,
  };
}

export type AcceptOfferHook = ReturnType<typeof useAcceptOffer>;
