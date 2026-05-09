"use client";

import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  MarketplaceSuccessState,
  MarketplaceErrorState,
  MarketplaceProcessingState,
} from "@/components/marketplace/marketplace-dialog-primitives";
import { EXPLORER_URL } from "@/lib/constants";
import { formatDisplayPrice } from "@/lib/utils";
import type { ApiOrder } from "@medialane/sdk";

interface AcceptOfferResultDialogProps {
  acceptStep: "idle" | "processing" | "success" | "error";
  acceptError: string | null;
  acceptTxHash: string | null;
  orderToAccept: ApiOrder | null;
  tokenName: string;
  tokenImage?: string | null;
  onDone: () => void;
  onRetry: () => void;
}

export function AcceptOfferResultDialog({
  acceptStep,
  acceptError,
  acceptTxHash,
  orderToAccept,
  tokenName,
  tokenImage,
  onDone,
  onRetry,
}: AcceptOfferResultDialogProps) {
  const open = acceptStep !== "idle";

  const handleOpenChange = (v: boolean) => {
    if (!v && acceptStep === "processing") return;
    if (!v) onDone();
  };

  const priceLabel = orderToAccept
    ? `${formatDisplayPrice(orderToAccept.price.formatted)} ${orderToAccept.price.currency}`
    : "";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-[calc(100%-6px)] sm:max-w-md p-0 overflow-hidden gap-0 rounded-2xl flex flex-col max-h-[92svh]">
        <DialogTitle className="sr-only">Accept offer on {tokenName}</DialogTitle>
        <DialogDescription className="sr-only">
          Accept offer result for {tokenName}.
        </DialogDescription>

        {acceptStep === "processing" && (
          <MarketplaceProcessingState
            title="Confirming on Starknet…"
            imageUrl={tokenImage ?? undefined}
            imageAlt={tokenName}
          />
        )}

        {acceptStep === "success" && (
          <MarketplaceSuccessState
            tokenImage={tokenImage}
            name={tokenName}
            title="It's sold!"
            description={
              <>
                You accepted an offer of{" "}
                <span className="font-semibold text-foreground">{priceLabel}</span>{" "}
                for <span className="font-medium text-foreground">{tokenName}</span>.
              </>
            }
            txHash={acceptTxHash}
            explorerUrl={EXPLORER_URL}
            onDone={onDone}
          />
        )}

        {acceptStep === "error" && (
          <MarketplaceErrorState
            tokenImage={tokenImage}
            name={tokenName}
            title="Offer acceptance failed"
            description="The transaction could not be completed. Your asset is still listed."
            error={acceptError}
            txHash={acceptTxHash}
            explorerUrl={EXPLORER_URL}
            onRetry={onRetry}
            onDone={onDone}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
