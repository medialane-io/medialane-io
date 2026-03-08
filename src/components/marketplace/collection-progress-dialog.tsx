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
  Layers,
} from "lucide-react";
import { useRouter } from "next/navigation";
import type { ChipiTransactionStatus } from "@/hooks/use-chipi-transaction";

export type CollectionStep = "idle" | "processing" | "success" | "error";

interface CollectionProgressDialogProps {
  open: boolean;
  collectionStep: CollectionStep;
  txStatus: ChipiTransactionStatus;
  collectionName: string;
  imagePreview: string | null;
  txHash: string | null;
  error: string | null;
  onCreateAnother: () => void;
}

const STEPS = [
  {
    label: "Create collection intent",
    done: (_: ChipiTransactionStatus) => true, // done as soon as processing starts
    active: (txStatus: ChipiTransactionStatus) => txStatus === "idle",
  },
  {
    label: "Submit transaction",
    done: (txStatus: ChipiTransactionStatus) =>
      txStatus === "confirming" || txStatus === "confirmed",
    active: (txStatus: ChipiTransactionStatus) => txStatus === "submitting",
  },
  {
    label: "Confirm on Starknet",
    done: (txStatus: ChipiTransactionStatus) => txStatus === "confirmed",
    active: (txStatus: ChipiTransactionStatus) => txStatus === "confirming",
  },
];

export function CollectionProgressDialog({
  open,
  collectionStep,
  txStatus,
  collectionName,
  imagePreview,
  txHash,
  error,
  onCreateAnother,
}: CollectionProgressDialogProps) {
  const router = useRouter();
  const confettiFired = useRef(false);

  useEffect(() => {
    if (collectionStep === "success" && !confettiFired.current) {
      confettiFired.current = true;
      fireConfetti();
    }
    if (collectionStep !== "success") {
      confettiFired.current = false;
    }
  }, [collectionStep]);

  const isProcessing = collectionStep === "processing";
  const isSuccess = collectionStep === "success";
  const isError = collectionStep === "error";

  return (
    <Dialog open={open} modal>
      <DialogContent
        className="sm:max-w-md"
        onInteractOutside={isProcessing ? (e) => e.preventDefault() : undefined}
        onEscapeKeyDown={isProcessing ? (e) => e.preventDefault() : undefined}
        {...(isProcessing ? { hideClose: true } : {})}
      >
        <DialogTitle className="sr-only">
          {isProcessing ? "Creating collection…" : isSuccess ? "Collection created!" : "Creation failed"}
        </DialogTitle>

        {/* ── Processing ── */}
        {isProcessing && (
          <div className="flex flex-col items-center gap-6 py-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>

            <div className="text-center space-y-1">
              <p className="font-semibold text-lg">Deploying collection…</p>
              <p className="text-sm text-muted-foreground">
                {txStatus === "confirming"
                  ? "Waiting for block confirmation"
                  : txStatus === "submitting"
                  ? "Submitting transaction"
                  : "Creating intent on-chain"}
              </p>
            </div>

            <div className="w-full space-y-2 rounded-xl border border-border/60 bg-muted/30 p-4">
              {STEPS.map(({ label, done, active }) => {
                const isDone = done(txStatus);
                const isActive = active(txStatus);
                return (
                  <div key={label} className="flex items-center gap-3">
                    {isDone ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                    ) : isActive ? (
                      <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />
                    ) : (
                      <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30 shrink-0" />
                    )}
                    <span
                      className={
                        isDone
                          ? "text-sm text-foreground"
                          : isActive
                          ? "text-sm text-primary font-medium"
                          : "text-sm text-muted-foreground"
                      }
                    >
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

        {/* ── Success ── */}
        {isSuccess && (
          <div className="flex flex-col items-center gap-5 py-2">
            <div className="relative">
              <div className="h-16 w-16 rounded-full bg-emerald-500/15 flex items-center justify-center">
                <CheckCircle2 className="h-9 w-9 text-emerald-500" />
              </div>
              <Sparkles className="absolute -top-1 -right-1 h-5 w-5 text-yellow-400" />
            </div>

            <div className="text-center space-y-1">
              <p className="font-bold text-xl">Collection deployed!</p>
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{collectionName || "Your collection"}</span> is
                live on Starknet. Start minting assets into it.
              </p>
            </div>

            {imagePreview && (
              <div className="h-24 w-24 rounded-xl overflow-hidden border border-border shadow-md">
                <img src={imagePreview} alt={collectionName} className="h-full w-full object-cover" />
              </div>
            )}

            {!imagePreview && (
              <div className="h-24 w-24 rounded-xl border border-border bg-primary/5 flex items-center justify-center">
                <Layers className="h-10 w-10 text-primary/40" />
              </div>
            )}

            {txHash && (
              <a
                href={`${EXPLORER_URL}/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <span className="font-mono">
                  {txHash.slice(0, 10)}…{txHash.slice(-8)}
                </span>
                <ExternalLink className="h-3 w-3" />
              </a>
            )}

            <div className="flex flex-col sm:flex-row gap-2 w-full pt-1">
              <Button variant="outline" className="flex-1" onClick={onCreateAnother}>
                Create another
              </Button>
              <Button className="flex-1" onClick={() => router.push("/create/asset")}>
                Mint an asset
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
              <p className="font-bold text-xl">Creation failed</p>
              {error && (
                <p className="text-sm text-muted-foreground max-w-xs mx-auto">{error}</p>
              )}
            </div>

            <Button variant="outline" className="w-full" onClick={onCreateAnother}>
              Try again
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
