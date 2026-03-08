"use client";

import { useEffect, useRef } from "react";
import confetti from "canvas-confetti";
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
} from "lucide-react";
import { useRouter } from "next/navigation";
import type { ChipiTransactionStatus } from "@/hooks/use-chipi-transaction";

export type MintStep = "idle" | "uploading" | "processing" | "success" | "error";

interface MintProgressDialogProps {
  open: boolean;
  mintStep: MintStep;
  txStatus: ChipiTransactionStatus;
  assetName: string;
  imagePreview: string | null;
  txHash: string | null;
  error: string | null;
  onMintAnother: () => void;
}

const STEPS = [
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

function fireConfetti() {
  const count = 220;
  const defaults = { origin: { y: 0.6 }, zIndex: 9999 };

  function fire(particleRatio: number, opts: confetti.Options) {
    confetti({ ...defaults, ...opts, particleCount: Math.floor(count * particleRatio) });
  }

  fire(0.25, { spread: 26, startVelocity: 55, colors: ["#a855f7", "#6366f1"] });
  fire(0.2, { spread: 60, colors: ["#10b981", "#34d399"] });
  fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8, colors: ["#f59e0b", "#fbbf24"] });
  fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2, colors: ["#ec4899"] });
  fire(0.1, { spread: 120, startVelocity: 45, colors: ["#a855f7", "#6366f1"] });
}

export function MintProgressDialog({
  open,
  mintStep,
  txStatus,
  assetName,
  imagePreview,
  txHash,
  error,
  onMintAnother,
}: MintProgressDialogProps) {
  const router = useRouter();
  const confettiFired = useRef(false);

  useEffect(() => {
    if (mintStep === "success" && !confettiFired.current) {
      confettiFired.current = true;
      fireConfetti();
    }
    if (mintStep !== "success") {
      confettiFired.current = false;
    }
  }, [mintStep]);

  const isProcessing = mintStep === "uploading" || mintStep === "processing";
  const isSuccess = mintStep === "success";
  const isError = mintStep === "error";

  return (
    <Dialog open={open} modal>
      <DialogContent
        className="sm:max-w-md"
        // Prevent closing during processing
        onInteractOutside={isProcessing ? (e) => e.preventDefault() : undefined}
        onEscapeKeyDown={isProcessing ? (e) => e.preventDefault() : undefined}
        // Hide the default X button during processing
        {...(isProcessing ? { hideClose: true } : {})}
      >
        <DialogTitle className="sr-only">
          {isProcessing ? "Minting asset…" : isSuccess ? "Asset minted!" : "Mint failed"}
        </DialogTitle>

        {/* ── Processing ── */}
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
              {STEPS.map(({ label, done }) => {
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
              <p className="font-bold text-xl">Minted!</p>
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{assetName || "Your asset"}</span> is
                now live on Starknet.
              </p>
            </div>

            {/* Asset preview */}
            {imagePreview && (
              <div className="h-28 w-28 rounded-xl overflow-hidden border border-border shadow-md">
                <img src={imagePreview} alt={assetName} className="h-full w-full object-cover" />
              </div>
            )}

            {/* Tx link */}
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
              <Button
                variant="outline"
                className="flex-1"
                onClick={onMintAnother}
              >
                Mint another
              </Button>
              <Button
                className="flex-1"
                onClick={() => router.push("/portfolio/assets")}
              >
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
              {error && (
                <p className="text-sm text-muted-foreground max-w-xs mx-auto">{error}</p>
              )}
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
