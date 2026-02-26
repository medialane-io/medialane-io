"use client";

import { Loader2, CheckCircle2, XCircle, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EXPLORER_URL } from "@/lib/constants";
import type { ChipiTransactionStatus } from "@/hooks/use-chipi-transaction";

interface TxStatusProps {
  status: ChipiTransactionStatus;
  txHash: string | null;
  error?: string | null;
  statusMessage?: string;
}

export function TxStatus({ status, txHash, error, statusMessage }: TxStatusProps) {
  if (status === "idle") return null;

  return (
    <div className="flex flex-col items-center gap-3 py-4">
      {(status === "submitting" || status === "confirming") && (
        <>
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">{statusMessage}</p>
        </>
      )}
      {status === "confirmed" && (
        <>
          <CheckCircle2 className="h-8 w-8 text-emerald-500" />
          <p className="text-sm font-medium">Transaction confirmed!</p>
          {txHash && (
            <Button variant="outline" size="sm" asChild>
              <a href={`${EXPLORER_URL}/tx/${txHash}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5">
                View on Voyager <ExternalLink className="h-3 w-3" />
              </a>
            </Button>
          )}
        </>
      )}
      {(status === "reverted" || status === "error") && (
        <>
          <XCircle className="h-8 w-8 text-destructive" />
          <p className="text-sm font-medium text-destructive">Transaction failed</p>
          {error && <p className="text-xs text-muted-foreground text-center max-w-xs">{error}</p>}
        </>
      )}
    </div>
  );
}
