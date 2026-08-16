"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { fireConfetti } from "@/lib/confetti";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { EXPLORER_URL } from "@/lib/constants";
import { Loader2, CheckCircle2, XCircle, ExternalLink, Sparkles } from "lucide-react";
import type { useWalletWriteAction, WalletWriteStatus } from "@/hooks/use-wallet-write-action";

interface WalletTransactionDialogProps {
  action: ReturnType<typeof useWalletWriteAction>;

  title: string;

  processingLabel?: string;

  firstStepLabel?: string;

  successTitle?: string;

  children?: ReactNode;
}

const makeSteps = (firstStepLabel: string) => [
  {
    label: firstStepLabel,
    done: () => true,
    active: (s: WalletWriteStatus) => s === "idle",
  },
  {
    label: "Submit transaction",
    done: (s: WalletWriteStatus) => s === "confirming" || s === "success",
    active: (s: WalletWriteStatus) => s === "processing",
  },
  {
    label: "Confirm on Starknet",
    done: (s: WalletWriteStatus) => s === "success",
    active: (s: WalletWriteStatus) => s === "confirming",
  },
];

export function WalletTransactionDialog({
  action,
  title,
  processingLabel = "Processing…",
  firstStepLabel = "Prepare transaction",
  successTitle = "Done!",
  children,
}: WalletTransactionDialogProps) {
  const { status, txHash, error, reset } = action;

  const isProcessing = status === "processing" || status === "confirming";
  const isSuccess = status === "success";
  const isError = status === "error";
  const open = status !== "idle";
  const STEPS = makeSteps(firstStepLabel);

  const confettiFired = useRef(false);
  useEffect(() => {
    if (isSuccess && !confettiFired.current) {
      confettiFired.current = true;
      fireConfetti();
    }
    if (!isSuccess) confettiFired.current = false;
  }, [isSuccess]);

  return (
    <Dialog open={open} modal onOpenChange={(v) => { if (!v && !isProcessing) reset(); }}>
      <DialogContent
        className="sm:max-w-md"
        onInteractOutside={isProcessing ? (e) => e.preventDefault() : undefined}
        onEscapeKeyDown={isProcessing ? (e) => e.preventDefault() : undefined}
        {...(isProcessing ? { hideClose: true } : {})}
      >
        <DialogTitle className="sr-only">
          {isProcessing ? processingLabel : isSuccess ? successTitle : title}
        </DialogTitle>

        {isProcessing && (
          <div className="flex flex-col items-center gap-6 py-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
            <div className="text-center space-y-1">
              <p className="font-semibold text-lg">{processingLabel}</p>
              <p className="text-sm text-muted-foreground">
                {status === "confirming" ? "Waiting for block confirmation" : "Submitting transaction"}
              </p>
            </div>
            <div className="w-full space-y-2 rounded-xl border border-border/60 bg-muted/30 p-4">
              {STEPS.map(({ label, done, active }) => {
                const isDone = done(status);
                const isActive = active(status);
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

        {isSuccess && (
          <div className="flex flex-col items-center gap-5 py-2">
            <div className="relative">
              <div className="h-16 w-16 rounded-full bg-emerald-500/15 flex items-center justify-center">
                <CheckCircle2 className="h-9 w-9 text-emerald-500" />
              </div>
              <Sparkles className="absolute -top-1 -right-1 h-5 w-5 text-brand-orange" />
            </div>
            <p className="font-bold text-xl">{successTitle}</p>
            {txHash && (
              <a
                href={`${EXPLORER_URL}/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <span>View transaction</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            )}

            {children}
          </div>
        )}

        {isError && (
          <div className="flex flex-col items-center gap-5 py-2">
            <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
              <XCircle className="h-9 w-9 text-destructive" />
            </div>
            <div className="text-center space-y-1">
              <p className="font-bold text-xl">Something went wrong</p>
              {error && <p className="text-sm text-muted-foreground max-w-xs mx-auto">{error}</p>}
            </div>
            <Button variant="outline" className="w-full" onClick={reset}>
              Try again
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
