"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import type { WalletRecovery } from "@medialane/sdk";
import { getMedialaneClient } from "@/lib/medialane-client";
import { EmailRecovery } from "@/components/wallet/email-recovery";
import { RecoveryKeyRestore } from "@/components/wallet/recovery-key-restore";

export function NewBrowserWallet({ onRecovered }: { onRecovered: () => void }) {
  const [status, setStatus] = useState<WalletRecovery | null | undefined>(undefined);

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
        <p className="text-sm text-muted-foreground">Finish your account setup and secure this devide</p>
        <EmailRecovery status={status} onStatus={setStatus} onRecovered={onRecovered} />
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      <p className="text-sm text-muted-foreground">
        Open Medialane there, go to Settings, then Recovery, and turn on recovery. After that, sign in here with your
        email to get your account back.
      </p>
      <RecoveryKeyRestore onRestored={onRecovered} />
    </div>
  );
}
