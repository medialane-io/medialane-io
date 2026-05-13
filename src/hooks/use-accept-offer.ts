"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { isWebAuthnSupported } from "@chipi-stack/nextjs";
import { usePasskeyAuth } from "@chipi-stack/chipi-passkey/hooks";
import { useMarketplace } from "@/hooks/use-marketplace";
import { useMarketplaceActionFlow } from "@/hooks/use-marketplace-action-flow";
import { useTokenBalance, hasSufficientBalance } from "@/hooks/use-erc20-balance";
import type { ApiOrder } from "@medialane/sdk";

interface UseAcceptOfferOptions {
  mutateListings: () => void;
  /** Force a specific NFT token standard (e.g. "ERC1155"). Falls back to the order's item types. */
  tokenStandard?: string;
}

export function useAcceptOffer({ mutateListings, tokenStandard }: UseAcceptOfferOptions) {
  const { isSignedIn } = useAuth();
  const { fulfillOrder, hasWallet, hasActiveSession, setupSession, maybeClearSessionForAmountCap } =
    useMarketplace();
  const [passkeyWebAuthnSupported] = useState(
    () => typeof window !== "undefined" && isWebAuthnSupported()
  );
  const { authenticate, encryptKey } = usePasskeyAuth();

  const [selectedOrder, setSelectedOrder] = useState<ApiOrder | null>(null);
  const [resultStep, setResultStep] = useState<"idle" | "processing" | "success" | "error">("idle");
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { rawBalance, decimals } = useTokenBalance(
    selectedOrder?.price.currency ?? null,
    selectedOrder?.offerer ?? null
  );
  const buyerHasFunds = selectedOrder
    ? hasSufficientBalance(rawBalance, selectedOrder.price.formatted ?? "", decimals)
    : null;

  const actionFlow = useMarketplaceActionFlow<ApiOrder>({
    isSignedIn,
    hasWallet,
    hasActiveSession,
    setupSession,
    maybeClearSessionForAmountCap,
    authenticate,
    encryptKey,
    executeAction: async (order, pinOrKey) => {
      setResultStep("processing");
      try {
        const nftStandard =
          order.offer.itemType === "ERC20"
            ? order.consideration.itemType
            : order.offer.itemType;
        const hash = await fulfillOrder({
          orderHash: order.orderHash,
          pin: pinOrKey,
          tokenStandard: tokenStandard ?? nftStandard,
        });
        if (!hash) throw new Error("Transaction failed — check your portfolio");
        setTxHash(hash);
        setResultStep("success");
        mutateListings();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Acceptance failed");
        setResultStep("error");
      }
    },
  });

  const handleAcceptClick = async (order: ApiOrder) => {
    setSelectedOrder(order);
    setResultStep("idle");
    setTxHash(null);
    setError(null);
    await actionFlow.beginAction(order, parseFloat(order.price.formatted ?? "0") || 0);
  };

  const dismiss = () => {
    if (resultStep === "processing") return;
    actionFlow.resetActionFlow();
    setSelectedOrder(null);
    setResultStep("idle");
    setTxHash(null);
    setError(null);
  };

  return {
    isOpen: actionFlow.step === "pin" || resultStep !== "idle",
    selectedOrder,
    buyerHasFunds,
    resultStep,
    txHash,
    error,
    passkeySupported: passkeyWebAuthnSupported && !!encryptKey,
    walletSetupOpen: actionFlow.walletSetupOpen,
    setWalletSetupOpen: actionFlow.setWalletSetupOpen,
    pin: actionFlow.pin,
    setPin: actionFlow.setPin,
    pinError: actionFlow.pinError,
    isAuthenticatingPasskey: actionFlow.isAuthenticatingPasskey,
    isActivatingSession: actionFlow.isActivatingSession,
    handleAcceptClick,
    handlePin: actionFlow.handlePin,
    handleUsePasskey: actionFlow.handleUsePasskey,
    dismiss,
    // Expose setStep so dialog can transition back to pin on retry
    setStep: actionFlow.setStep,
  };
}

export type AcceptOfferHook = ReturnType<typeof useAcceptOffer>;
