"use client";

import { MarketplaceDialog } from "@/components/marketplace/dialog-frame";
import type { CancelOrderHook } from "@/hooks/use-cancel-order";
import { CancelOrderConfirm, TransactionDialogStates, successMessages } from "@medialane/ui";
import { resolveImage } from "@/lib/utils";

interface CancelOrderDialogProps {
  hook: CancelOrderHook;

  variant?: "listing" | "offer";

  tokenName?: string | null;

  tokenImage?: string | null;
}

export function CancelOrderDialog({ hook, variant, tokenName, tokenImage }: CancelOrderDialogProps) {
  const { order, phase, txHash, error, retryable, confirm, dismiss } = hook;

  const resolvedVariant: "listing" | "offer" =
    variant ?? (order?.offer.itemType === "ERC721" || order?.offer.itemType === "ERC1155" ? "listing" : "offer");

  const handleClose = (v: boolean) => {
    if (!v) dismiss();
  };

  const resolvedName = order?.token?.name ?? tokenName ?? "Asset";

  return (
    <MarketplaceDialog
      open={order !== null}
      onOpenChange={handleClose}
      title={`Cancel ${resolvedVariant} for ${resolvedName}`}
      description={`Enter the PIN to cancel this ${resolvedVariant}.`}
    >
      <TransactionDialogStates
        phase={phase}
        statusMessage="Confirming onchain…"
        txHash={txHash}
        error={error}
        success={successMessages.cancelled({ kind: resolvedVariant })}
        asset={{ name: resolvedName, image: resolveImage(order?.token?.image ?? tokenImage) }}
        errorTitle={`${resolvedVariant === "listing" ? "Listing" : "Offer"} cancellation failed`}
        errorDescription={`The transaction was submitted, but this ${resolvedVariant} could not be cancelled.`}
        onRetry={retryable ? confirm : undefined}
        onDone={dismiss}
      >
        {order && (
          <CancelOrderConfirm
            variant={resolvedVariant}
            name={resolvedName}
            image={resolveImage(order.token?.image ?? tokenImage)}
            price={order.price}
            error={error}
            onKeep={dismiss}
            onConfirm={confirm}
          />
        )}
      </TransactionDialogStates>
    </MarketplaceDialog>
  );
}
