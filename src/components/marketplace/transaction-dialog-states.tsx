"use client";

import type { ReactNode } from "react";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TxStatus } from "@/components/transaction/tx-status";
import { MarketplaceErrorState } from "@/components/marketplace/marketplace-dialog-primitives";
import { EXPLORER_URL } from "@/lib/constants";
import { ipfsToHttp } from "@/lib/utils";
import type { WalletWriteStatus } from "@/hooks/use-wallet-write-action";

interface TransactionDialogStatesProps {
  status: WalletWriteStatus | undefined;
  statusMessage?: string;
  txHash: string | null;
  error: string | null;
  isSubmitting: boolean;
  successTitle: string;

  successBody: ReactNode;

  successImage?: string | null;

  successImageAlt?: string;
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
  const isSuccess = status === "success" && !error;
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
