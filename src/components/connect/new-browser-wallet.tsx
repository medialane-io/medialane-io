"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@medialane/ui/button";
import type { WalletRecovery } from "@medialane/sdk";
import { getMedialaneClient } from "@/lib/medialane-client";
import { EmailRecovery } from "@/components/wallet/email-recovery";
import { RecoveryKeyRestore } from "@/components/wallet/recovery-key-restore";
import { SupportForm } from "./support-form";

const OPTION_CLASS = "h-auto w-full whitespace-normal py-3";

type View = "options" | "key" | "support" | "new-wallet";

export function NewBrowserWallet({
  onRecovered,
  onStartNew,
  onUseAnotherEmail,
}: {
  onRecovered: () => void;
  onStartNew: () => void;
  onUseAnotherEmail: () => void;
}) {
  const [status, setStatus] = useState<WalletRecovery | null | undefined>(undefined);
  const [view, setView] = useState<View>("options");

  useEffect(() => {
    getMedialaneClient().api.account.walletRecovery().then(setStatus).catch(() => setStatus(null));
  }, []);

  const back = () => setView("options");
  const anotherEmail = (
    <Button variant="link" className="h-auto w-full p-0 text-xs text-muted-foreground" onClick={onUseAnotherEmail}>
      Use a different email
    </Button>
  );

  if (status === undefined) {
    return (
      <div className="flex w-full items-center gap-2 py-2.5 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Checking your account
      </div>
    );
  }

  if (view === "support") return <SupportForm onBack={back} />;

  if (status?.enabled) {
    return (
      <div className="w-full space-y-4">
        <p className="text-sm text-muted-foreground">Finish your account setup and secure this device</p>
        <EmailRecovery status={status} onStatus={setStatus} onRecovered={onRecovered} />
        <Button variant="ghost" className="w-full" onClick={() => setView("support")}>
          Need help? Write to our team
        </Button>
        {anotherEmail}
      </div>
    );
  }

  if (view === "key") {
    return (
      <div className="w-full space-y-4">
        <RecoveryKeyRestore onRestored={onRecovered} />
        <Button variant="ghost" className="w-full" onClick={back}>
          Back
        </Button>
      </div>
    );
  }

  if (view === "new-wallet") {
    return (
      <div className="w-full space-y-4">
        <div className="space-y-1">
          <p className="text-sm font-medium">Start a new wallet?</p>
          <p className="text-sm text-muted-foreground">
            This account gets a fresh wallet. What&apos;s in your current wallet won&apos;t show up in the new one
            automatically. If you&apos;d like help with it, write to our team first.
          </p>
        </div>
        <Button className={OPTION_CLASS} onClick={() => setView("support")}>
          Write to our team
        </Button>
        <Button variant="outline" className={OPTION_CLASS} onClick={onStartNew}>
          Start a new wallet
        </Button>
        <Button variant="ghost" className="w-full" onClick={back}>
          Cancel
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      <p className="text-sm text-muted-foreground">Your account is ready. This device just needs its key to open it.</p>
      <div className="space-y-1.5">
        <Button className={OPTION_CLASS} onClick={() => setView("key")}>
          I have my recovery key
        </Button>
        <p className="text-xs text-muted-foreground">Paste it to bring back your account and everything in it.</p>
      </div>
      <div className="space-y-1.5">
        <Button variant="outline" className={OPTION_CLASS} onClick={() => setView("support")}>
          I can&apos;t find my recovery key
        </Button>
        <p className="text-xs text-muted-foreground">Write to our team. We&apos;ll help and reply to your email.</p>
      </div>
      <div className="space-y-2 pt-1">
        <Button
          variant="link"
          className="h-auto w-full p-0 text-xs text-muted-foreground"
          onClick={() => setView("new-wallet")}
        >
          Start a new wallet instead
        </Button>
        {anotherEmail}
      </div>
    </div>
  );
}
