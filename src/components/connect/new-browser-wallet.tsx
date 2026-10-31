"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@medialane/ui/button";
import type { WalletRecovery } from "@medialane/sdk";
import { getMedialaneClient } from "@/lib/medialane-client";
import { REPLACE_WALLET_CONFIRM } from "@/lib/wallet/replace-wallet-confirm";
import { EmailRecovery } from "@/components/wallet/email-recovery";
import { RecoveryKeyRestore } from "@/components/wallet/recovery-key-restore";

const OPTION_CLASS = "h-auto w-full whitespace-normal py-3";

export function NewBrowserWallet({ onRecovered, onStartNew }: { onRecovered: () => void; onStartNew: () => void }) {
  const [status, setStatus] = useState<WalletRecovery | null | undefined>(undefined);
  const [usingKey, setUsingKey] = useState(false);

  useEffect(() => {
    getMedialaneClient().api.account.walletRecovery().then(setStatus).catch(() => setStatus(null));
  }, []);

  if (status === undefined) {
    return (
      <div className="flex w-full items-center gap-2 py-2.5 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Checking your account
      </div>
    );
  }

  if (status?.enabled) {
    return (
      <div className="w-full space-y-4">
        <p className="text-sm text-muted-foreground">Finish your account setup and secure this device</p>
        <EmailRecovery status={status} onStatus={setStatus} onRecovered={onRecovered} />
      </div>
    );
  }

  if (usingKey) {
    return (
      <div className="w-full space-y-4">
        <RecoveryKeyRestore onRestored={onRecovered} />
        <Button variant="ghost" className="w-full" onClick={() => setUsingKey(false)}>
          Back
        </Button>
      </div>
    );
  }

  const startNew = () => {
    if (window.confirm(REPLACE_WALLET_CONFIRM)) onStartNew();
  };

  return (
    <div className="w-full space-y-3">
      <Button className={OPTION_CLASS} onClick={() => setUsingKey(true)}>
        I have my recovery key from Medialane
      </Button>
      <Button variant="outline" className={OPTION_CLASS} onClick={startNew}>
        I don&apos;t have the recovery key and want to start a new wallet
      </Button>
    </div>
  );
}
