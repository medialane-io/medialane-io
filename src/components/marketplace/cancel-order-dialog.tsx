"use client";

import { ShieldCheck } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@medialane/ui/dialog";
import type { CancelOrderHook } from "@/hooks/use-cancel-order";
import { MarketplaceConfirmStep, OrderSummaryHero, TransactionDialogStates, successMessages } from "@medialane/ui";
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
    <Dialog open={order !== null} onOpenChange={handleClose}>
      <DialogContent className="max-w-[calc(100%-6px)] sm:max-w-md p-0 overflow-hidden gap-0 rounded-2xl">
        <DialogTitle className="sr-only">Cancel {resolvedVariant} for {resolvedName}</DialogTitle>
        <DialogDescription className="sr-only">
          Enter your PIN to cancel this {resolvedVariant}. This action cannot be undone.
        </DialogDescription>

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
            <div className="space-y-0">
              <OrderSummaryHero
                name={resolvedName}
                image={resolveImage(order.token?.image ?? tokenImage)}
                subtitle={<span className="capitalize">Cancel {resolvedVariant}</span>}
                tone="destructive"
                price={order.price}
              />
              <MarketplaceConfirmStep
                description={`Cancel this ${resolvedVariant}? This action cannot be undone.`}
                error={error}
                secondaryLabel="Keep it"
                onSecondary={dismiss}
                primaryLabel={`Cancel ${resolvedVariant}`}
                onPrimary={confirm}
                primaryVariant="destructive"
                footer={(
                  <div className="flex items-start justify-center gap-1.5">
                    <ShieldCheck className="h-3 w-3 text-muted-foreground shrink-0 mt-0.5" />
                    <p className="text-2xs text-center text-muted-foreground">
                      Cancellation is recorded onchain — the order is permanently removed from the marketplace. Gas is sponsored by Medialane.
                    </p>
                  </div>
                )}
              />
            </div>
          )}
        </TransactionDialogStates>

      </DialogContent>
    </Dialog>
  );
}
