"use client";

import { useEffect, useRef } from "react";
import { fireConfetti } from "@/lib/confetti";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { EXPLORER_URL } from "@/lib/constants";
import {
  Loader2,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Sparkles,
  Tag,
} from "lucide-react";
import { useRouter } from "next/navigation";
import type { ChipiTransactionStatus } from "@/hooks/use-chipi-transaction";

export type MintStep = "idle" | "uploading" | "processing" | "success" | "error";
export type ListingStep = "idle" | "polling" | "listing" | "listed" | "failed";

interface MintProgressDialogProps {
  open: boolean;
  mintStep: MintStep;
  txStatus: ChipiTransactionStatus;
  assetName: string;
  imagePreview: string | null;
  txHash: string | null;
  error: string | null;
  onMintAnother: () => void;
  listingStep?: ListingStep;
  listingError?: string | null;
}

const MINT_STEPS = [
  {
    label: "Upload to IPFS",
    done: (mintStep: MintStep, txStatus: ChipiTransactionStatus) =>
      mintStep === "processing" || mintStep === "success" ||
      txStatus === "submitting" || txStatus === "confirming" || txStatus === "confirmed",
  },
  {
    label: "Submit transaction",
    done: (_: MintStep, txStatus: ChipiTransactionStatus) =>
      txStatus === "confirming" || txStatus === "confirmed",
  },
  {
    label: "Confirm on Starknet",
    done: (_: MintStep, txStatus: ChipiTransactionStatus) =>
      txStatus === "confirmed",
  },
];

export function MintProgressDialog({
  open,
  mintStep,
  txStatus,
  assetName,
  imagePreview,
  txHash,
  error,
  onMintAnother,
  listingStep = "idle",
  listingError,
}: MintProgressDialogProps) {
  const router = useRouter();
  const confettiFired = useRef(false);

  useEffect(() => {
    if (mintStep === "success" && listingStep === "idle" && !confettiFired.current) {
      confettiFired.current = true;
      fireConfetti();
    }
    if (listingStep === "listed" && !confettiFired.current) {
      confettiFired.current = true;
      fireConfetti();
    }
    if (mintStep !== "success") {
      confettiFired.current = false;
    }
  }, [mintStep, listingStep]);

  const isProcessing = mintStep === "uploading" || mintStep === "processing";
  const isListing = listingStep === "polling" || listingStep === "listing";
  const isFullSuccess = mintStep === "success" && listingStep === "listed";
  const isSuccess = mintStep === "success" && !isListing && !isFullSuccess;
  const isError = mintStep === "error";

  return (
    <Dialog open={open} modal onOpenChange={(v) => { if (!v && !isProcessing && !isListing) onMintAnother(); }}>
      <DialogContent
        className="sm:max-w-md"
        onInteractOutside={(isProcessing || isListing) ? (e) => e.preventDefault() : undefined}
        onEscapeKeyDown={(isProcessing || isListing) ? (e) => e.preventDefault() : undefined}
        {...((isProcessing || isListing) ? { hideClose: true } : {})}
      >
        <DialogTitle className="sr-only">
          {isProcessing ? "Minting asset…" : isListing ? "Listing on marketplace…" : isFullSuccess ? "Asset minted and listed!" : isSuccess ? "Asset minted!" : "Mint failed"}
        </DialogTitle>

        {/* ── Processing (mint) ── */}
        {isProcessing && (
          <div className="flex flex-col items-center gap-6 py-4">
            <div className="relative">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            </div>

            <div className="text-center space-y-1">
              <p className="font-semibold text-lg">
                {mintStep === "uploading" ? "Uploading to IPFS…" : "Minting on Starknet…"}
              </p>
              <p className="text-sm text-muted-foreground">
                {mintStep === "uploading"
                  ? "Pinning your metadata to IPFS"
                  : txStatus === "confirming"
                  ? "Waiting for block confirmation"
                  : "Submitting transaction"}
              </p>
            </div>

            <div className="w-full space-y-2 rounded-xl border border-border/60 bg-muted/30 p-4">
              {MINT_STEPS.map(({ label, done }) => {
                const isDone = done(mintStep, txStatus);
                const isActive =
                  (label === "Upload to IPFS" && mintStep === "uploading") ||
                  (label === "Submit transaction" && mintStep === "processing" && txStatus === "submitting") ||
                  (label === "Confirm on Starknet" && txStatus === "confirming");
                return (
                  <div key={label} className="flex items-center gap-3">
                    {isDone ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                    ) : isActive ? (
                      <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />
                    ) : (
                      <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30 shrink-0" />
                    )}
                    <span className={isDone ? "text-sm text-foreground" : isActive ? "text-sm text-primary font-medium" : "text-sm text-muted-foreground"}>
                      {label}
                    </span>
                  </div>
                );
              })}
            </div>

            <p className="text-xs text-muted-foreground text-center">
              This usually takes 10–30 seconds. Do not close this window.
            </p>
          </div>
        )}

        {/* ── Listing in progress ── */}
        {isListing && (
          <div className="flex flex-col items-center gap-6 py-4">
            <div className="relative">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            </div>
            <div className="text-center space-y-1">
              <p className="font-semibold text-lg">Listing on marketplace…</p>
              <p className="text-sm text-muted-foreground">
                {listingStep === "polling"
                  ? "Waiting for the asset to be indexed (~10s)"
                  : "Creating your listing"}
              </p>
            </div>
            <div className="w-full space-y-2 rounded-xl border border-border/60 bg-muted/30 p-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                <span className="text-sm text-foreground">Minted on Starknet</span>
              </div>
              <div className="flex items-center gap-3">
                {listingStep === "listing" ? (
                  <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />
                ) : (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground/50 shrink-0" />
                )}
                <span className={listingStep === "listing" ? "text-sm text-primary font-medium" : "text-sm text-muted-foreground"}>
                  {listingStep === "polling" ? "Waiting for indexer…" : "Creating listing"}
                </span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Almost done. Do not close this window.
            </p>
          </div>
        )}

        {/* ── Full success (mint + listed) ── */}
        {isFullSuccess && (
          <div className="flex flex-col items-center gap-5 py-2">
            <div className="relative">
              <div className="h-16 w-16 rounded-full bg-emerald-500/15 flex items-center justify-center">
                <CheckCircle2 className="h-9 w-9 text-emerald-500" />
              </div>
              <Sparkles className="absolute -top-1 -right-1 h-5 w-5 text-yellow-400" />
            </div>
            <div className="text-center space-y-1">
              <p className="font-bold text-xl">Minted & Listed!</p>
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{assetName || "Your asset"}</span> is now live on the marketplace.
              </p>
            </div>
            {imagePreview && (
              <div className="h-28 w-28 rounded-xl overflow-hidden border border-border shadow-md">
                <img src={imagePreview} alt={assetName} className="h-full w-full object-cover" />
              </div>
            )}
            {txHash && (
              <a
                href={`${EXPLORER_URL}/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <span className="font-mono">{txHash.slice(0, 10)}…{txHash.slice(-8)}</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
            <div className="flex flex-col sm:flex-row gap-2 w-full pt-1">
              <Button variant="outline" className="flex-1" onClick={onMintAnother}>
                Mint another
              </Button>
              <Button className="flex-1" onClick={() => router.push("/marketplace")}>
                View on market
              </Button>
            </div>
          </div>
        )}

        {/* ── Mint success only (no listing, or listing failed) ── */}
        {isSuccess && (
          <div className="flex flex-col items-center gap-5 py-2">
            <div className="relative">
              <div className="h-16 w-16 rounded-full bg-emerald-500/15 flex items-center justify-center">
                <CheckCircle2 className="h-9 w-9 text-emerald-500" />
              </div>
              <Sparkles className="absolute -top-1 -right-1 h-5 w-5 text-yellow-400" />
            </div>
            <div className="text-center space-y-1">
              <p className="font-bold text-xl">Minted!</p>
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{assetName || "Your asset"}</span> is now live on Starknet.
              </p>
            </div>
            {imagePreview && (
              <div className="h-28 w-28 rounded-xl overflow-hidden border border-border shadow-md">
                <img src={imagePreview} alt={assetName} className="h-full w-full object-cover" />
              </div>
            )}
            {txHash && (
              <a
                href={`${EXPLORER_URL}/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <span className="font-mono">{txHash.slice(0, 10)}…{txHash.slice(-8)}</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
            {listingError && (
              <div className="w-full rounded-xl border border-yellow-500/30 bg-yellow-500/5 px-4 py-3 flex items-start gap-2">
                <Tag className="h-4 w-4 text-yellow-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400">Listing failed</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{listingError} — you can list it from your portfolio.</p>
                </div>
              </div>
            )}
            <div className="flex flex-col sm:flex-row gap-2 w-full pt-1">
              <Button variant="outline" className="flex-1" onClick={onMintAnother}>
                Mint another
              </Button>
              <Button className="flex-1" onClick={() => router.push("/portfolio/assets")}>
                View portfolio
              </Button>
            </div>
          </div>
        )}

        {/* ── Error ── */}
        {isError && (
          <div className="flex flex-col items-center gap-5 py-2">
            <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
              <XCircle className="h-9 w-9 text-destructive" />
            </div>
            <div className="text-center space-y-1">
              <p className="font-bold text-xl">Mint failed</p>
              {error && <p className="text-sm text-muted-foreground max-w-xs mx-auto">{error}</p>}
            </div>
            <Button variant="outline" className="w-full" onClick={onMintAnother}>
              Try again
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
