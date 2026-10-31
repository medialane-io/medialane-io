"use client";

import { Dialog, DialogContent } from "@medialane/ui/dialog";
import {
  MarketplaceProcessingState,
  successMessages,
  MarketplaceErrorState,
} from "@medialane/ui";
import { EXPLORER_URL } from "@/lib/constants";
import { DialogTransactionSuccess } from "@/components/marketplace/dialog-transaction-success";

interface CancelListingDialogProps {
  cancelStep: "idle" | "processing" | "success" | "error";
  cancelError: string | null;
  tokenName?: string;
  tokenImage?: string | null;
  onReset: () => void;
}

export function CancelListingDialog({
  cancelStep,
  cancelError,
  tokenName = "this listing",
  tokenImage,
  onReset,
}: CancelListingDialogProps) {
  return (
    <Dialog
      open={cancelStep !== "idle"}
      onOpenChange={(v) => { if (!v) onReset(); }}
    >
      <DialogContent className="max-w-[calc(100%-6px)] sm:max-w-sm rounded-2xl p-0 overflow-hidden">
        {cancelStep === "processing" && (
          <MarketplaceProcessingState
            title="Cancelling listing…"
            imageUrl={tokenImage}
            imageAlt={tokenName}
          />
        )}
        {cancelStep === "success" && (
          <DialogTransactionSuccess
            name={tokenName}
            image={tokenImage}
            {...successMessages.cancelled({ kind: "listing" })}
            actions={[{ label: "Done", onClick: onReset }]}
          />
        )}
        {cancelStep === "error" && (
          <MarketplaceErrorState
            tokenImage={tokenImage}
            name={tokenName}
            title="Cancellation failed"
            description={cancelError}
            explorerUrl={EXPLORER_URL}
            onDone={onReset}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
