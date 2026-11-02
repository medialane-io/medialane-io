"use client";

import type { ReactNode } from "react";
import { TxStatus } from "@/components/transaction/tx-status";
import { DialogTransactionSuccess, MarketplaceErrorState, type SuccessMessage, type TransactionPhase } from "@medialane/ui";
import { EXPLORER_URL } from "@/lib/constants";
import { resolveImage } from "@/lib/utils";
import { isBusyPhase } from "@/hooks/use-marketplace-transaction";

interface TransactionDialogStatesProps {
  phase: TransactionPhase;
  statusMessage?: string;
  txHash: string | null;
  error: string | null;
  success: SuccessMessage;
  successImage?: string | null;
  successName: string;
  errorTitle: string;
  errorDescription: string;

  errorAssetName?: string;

  errorAssetImage?: string | null;
  onRetry?: () => void;
  onDone: () => void;

  children: ReactNode;
}

export function TransactionDialogStates({
  phase,
  statusMessage,
  txHash,
  error,
  success,
  successImage = null,
  successName,
  errorTitle,
  errorDescription,
  errorAssetName,
  errorAssetImage = null,
  onRetry,
  onDone,
  children,
}: TransactionDialogStatesProps) {
  const successSrc = resolveImage(successImage);
  const isSubmitting = isBusyPhase(phase);
  const isSuccess = phase === "success" && !error;
  const isTerminalError = !isSubmitting && !!error && !!txHash;

  if (isSuccess) {
    return (
      <DialogTransactionSuccess
        name={successName}
        image={successSrc}
        {...success}
        actions={[{ label: "Done", onClick: onDone }]}
      />
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
          phase={phase}
          txHash={txHash}
          error={error}
          statusMessage={statusMessage}
        />
      </div>
    );
  }

  return <>{children}</>;
}
