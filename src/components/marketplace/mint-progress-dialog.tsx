"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Image from "next/image";
import { fireConfetti } from "@medialane/ui/utils/media-wallet/confetti";
import { Dialog, DialogContent, DialogTitle } from "@medialane/ui/dialog";
import { Button } from "@medialane/ui/button";
import { CreationSuccess } from "@medialane/ui";
import {
  Loader2,
  CheckCircle2,
  XCircle,
  Tag,
} from "lucide-react";
import type { MintTxStatus } from "@/types/mint-tx-status";

export type MintStep = "idle" | "uploading" | "processing" | "success" | "error";
export type ListingStep = "idle" | "polling" | "listing" | "listed" | "failed";

interface MintProgressDialogProps {
  open: boolean;
  mintStep: MintStep;
  txStatus: MintTxStatus;
  assetName: string;
  imagePreview: string | null;
  error: string | null;
  onMintAnother: () => void;
  assetHref?: string | null;
  listingStep?: ListingStep;
  listingError?: string | null;
  successFooter?: ReactNode;
  debug?: unknown;
}

const MINT_STEPS = [
  {
    label: "Upload to IPFS",
    done: (mintStep: MintStep, txStatus: MintTxStatus) =>
      mintStep === "processing" || mintStep === "success" ||
      txStatus === "submitting" || txStatus === "confirming" || txStatus === "confirmed",
  },
  {
    label: "Submit transaction",
    done: (_: MintStep, txStatus: MintTxStatus) =>
      txStatus === "confirming" || txStatus === "confirmed",
  },
  {
    label: "Confirm onchain",
    done: (_: MintStep, txStatus: MintTxStatus) =>
      txStatus === "confirmed",
  },
];

export function MintProgressDialog({
  open,
  mintStep,
  txStatus,
  assetName,
  imagePreview,
  error,
  onMintAnother,
  assetHref,
  listingStep = "idle",
  listingError,
  successFooter,
  debug,
}: MintProgressDialogProps) {
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

        {isProcessing && (
          <div className="flex flex-col items-center gap-6 py-4">
            <div className="relative">
              {imagePreview ? (
                <div className="relative h-20 w-20 rounded-2xl overflow-hidden border border-border shadow-md">
                  <Image src={imagePreview} alt={assetName} fill className="object-cover" />
                  <div className="absolute inset-0 bg-background/50 flex items-center justify-center">
                    <Loader2 className="h-7 w-7 animate-spin text-primary" />
                  </div>
                </div>
              ) : (
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              )}
            </div>

            <div className="text-center space-y-1">
              <p className="font-semibold text-lg">
                {mintStep === "uploading" ? "Uploading to IPFS…" : "Minting onchain…"}
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
                  (label === "Confirm onchain" && txStatus === "confirming");
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
                <span className="text-sm text-foreground">Minted onchain</span>
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

        {(isFullSuccess || isSuccess) && (
          <CreationSuccess
            name={assetName || "Your asset"}
            image={imagePreview}
            caption={isFullSuccess ? "Your work is live on the market" : "Your work is live"}
            primary={assetHref ? { href: assetHref, label: "View asset" } : { href: "/portfolio/assets", label: "View portfolio" }}
            secondary={isFullSuccess ? { href: "/marketplace", label: "View on market" } : assetHref ? { href: "/portfolio/assets", label: "View portfolio" } : undefined}
            onAgain={onMintAnother}
            againLabel="Mint another"
          >
            {listingError && (
              <div className="w-full rounded-xl border border-yellow-500/30 bg-yellow-500/5 px-4 py-3 flex items-start gap-2 text-left">
                <Tag className="h-4 w-4 text-yellow-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400">Listing failed</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{listingError} — you can list it from your portfolio.</p>
                </div>
              </div>
            )}
            {successFooter}
          </CreationSuccess>
        )}

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
            {debug != null && <ErrorDetails debug={debug} />}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ErrorDetails({ debug }: { debug: unknown }) {
  const [copied, setCopied] = useState(false);
  const text = JSON.stringify(debug, null, 2);
  return (
    <details className="w-full text-left">
      <summary className="cursor-pointer text-xs text-muted-foreground">Technical details</summary>
      <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap break-all rounded-lg bg-muted p-3 text-[11px] text-muted-foreground">
        {text}
      </pre>
      <Button
        variant="ghost"
        size="sm"
        className="mt-1 w-full"
        onClick={() => {
          void navigator.clipboard?.writeText(text).then(() => setCopied(true), () => setCopied(false));
        }}
      >
        {copied ? "Copied" : "Copy details"}
      </Button>
    </details>
  );
}
