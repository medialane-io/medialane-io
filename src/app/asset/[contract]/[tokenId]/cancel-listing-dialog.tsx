"use client";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  MarketplaceProcessingState,
  MarketplaceSuccessState,
  MarketplaceErrorState,
} from "@/components/marketplace/marketplace-dialog-primitives";
import { EXPLORER_URL } from "@/lib/constants";

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
          <MarketplaceSuccessState
            tokenImage={tokenImage}
            name={tokenName}
            title="Listing cancelled"
            description="Your listing has been removed from the marketplace."
            explorerUrl={EXPLORER_URL}
            onDone={onReset}
          />
        )}
        {cancelStep === "error" && (
          <MarketplaceErrorState
            tokenImage={tokenImage}
            name={tokenName}
            title="Cancellation failed"
            description="Something went wrong while cancelling your listing."
            error={cancelError}
            explorerUrl={EXPLORER_URL}
            onDone={onReset}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
