"use client";

import type { ReactNode } from "react";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TxStatus } from "@/components/chipi/tx-status";
import { MarketplaceErrorState } from "@/components/marketplace/marketplace-dialog-primitives";
import { EXPLORER_URL } from "@/lib/constants";
import { ipfsToHttp } from "@/lib/utils";
import type { ChipiTransactionStatus } from "@/hooks/use-chipi-transaction";

/**
 * Shared transaction dialog state machine. Renders the success / error /
 * processing branches that contract-call dialogs all share; children render
 * for the idle (form / pin entry) phase.
 *
 * Accepts the surface exposed by `useChipiTransaction`. CancelOrderDialog
 * (which goes through `useMarketplace`) uses a slightly different status
 * field name and isn't migrated yet — it's a follow-up if/when its hook is
 * unified.
 */
interface TransactionDialogStatesProps {
  status: ChipiTransactionStatus | undefined;
  statusMessage?: string;
  txHash: string | null;
  error: string | null;
  isSubmitting: boolean;
  successTitle: string;
  /** ReactNode so consumers can render dynamic content (addresses, totals, …). */
  successBody: ReactNode;
  /** Optional asset image rendered between the check mark and the title. ipfs:// or http(s). */
  successImage?: string | null;
  /** Alt text for the success image. */
  successImageAlt?: string;
  errorTitle: string;
  errorDescription: string;
  /** Optional name passed through to MarketplaceErrorState. */
  errorAssetName?: string;
  /** Optional image passed through to MarketplaceErrorState. */
  errorAssetImage?: string | null;
  onRetry: () => void;
  onDone: () => void;
  /** Rendered when no terminal state is active (idle / form / pin entry). */
  children: ReactNode;
}

export function TransactionDialogStates({
  status,
  statusMessage,
  txHash,
  error,
  isSubmitting,
  successTitle,
  successBody,
  successImage = null,
  successImageAlt,
  errorTitle,
  errorDescription,
  errorAssetName,
  errorAssetImage = null,
  onRetry,
  onDone,
  children,
}: TransactionDialogStatesProps) {
  const isSuccess = status === "confirmed" && !error;
  const isTerminalError = !isSubmitting && !!error && !!txHash;

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center gap-5 p-6 py-8">
        <div className="h-16 w-16 rounded-full bg-emerald-500/15 flex items-center justify-center">
          <CheckCircle2 className="h-9 w-9 text-emerald-500" />
        </div>
        {successImage && (
          <div className="h-24 w-24 rounded-2xl overflow-hidden border border-border shadow-md">
            <img
              src={ipfsToHttp(successImage)}
              alt={successImageAlt ?? "Asset"}
              className="h-full w-full object-cover"
            />
          </div>
        )}
        <div className="text-center space-y-1">
          <p className="font-bold text-xl">{successTitle}</p>
          <div className="text-sm text-muted-foreground">{successBody}</div>
        </div>
        <Button className="w-full" onClick={onDone}>
          Done
        </Button>
      </div>
    );
  }

  if (isTerminalError) {
    return (
      <MarketplaceErrorState
        tokenImage={errorAssetImage}
        name={errorAssetName ?? "Asset"}
        title={errorTitle}
        description={errorDescription}
        error={error}
        txHash={txHash}
        explorerUrl={EXPLORER_URL}
        onRetry={onRetry}
        onDone={onDone}
      />
    );
  }

  if (isSubmitting) {
    return (
      <div className="p-6">
        <TxStatus
          status={status ?? "idle"}
          txHash={txHash}
          error={error}
          statusMessage={statusMessage}
        />
      </div>
    );
  }

  return <>{children}</>;
}
