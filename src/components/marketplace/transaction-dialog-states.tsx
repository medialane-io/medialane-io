"use client";

import type { ReactNode } from "react";
import { TxStatus } from "@/components/transaction/tx-status";
import { MarketplaceErrorState, TransactionSuccess, type SuccessMessage } from "@medialane/ui";
import { EXPLORER_URL } from "@/lib/constants";
import { resolveImage } from "@/lib/utils";
import type { WalletWriteStatus } from "@/hooks/use-wallet-write-action";

interface TransactionDialogStatesProps {
  status: WalletWriteStatus | undefined;
  statusMessage?: string;
  txHash: string | null;
  error: string | null;
  isSubmitting: boolean;
  success: SuccessMessage;
  successImage?: string | null;
  successName: string;
  errorTitle: string;
  errorDescription: string;

  errorAssetName?: string;

  errorAssetImage?: string | null;
  onRetry: () => void;
  onDone: () => void;

  children: ReactNode;
}

export function TransactionDialogStates({
  status,
  statusMessage,
  txHash,
  error,
  isSubmitting,
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
  const isSuccess = status === "success" && !error;
  const isTerminalError = !isSubmitting && !!error && !!txHash;

  if (isSuccess) {
    return (
      <TransactionSuccess
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
