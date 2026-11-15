"use client";

import { useEffect, useId, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@medialane/ui/button";
import type { WalletRecovery } from "@medialane/sdk";
import { getMedialaneClient } from "@/lib/medialane-client";
import { EmailRecovery } from "@/components/wallet/email-recovery";
import { RecoveryKeyRestore } from "@/components/wallet/recovery-key-restore";
import { SupportForm } from "./support-form";

const OPTION_CLASS = "h-auto w-full whitespace-normal py-3";

function OptionButton({
  title,
  description,
  primary,
  onClick,
}: {
  title: string;
  description: string;
  primary?: boolean;
  onClick: () => void;
}) {
  const id = useId();
  return (
    <Button
      variant={primary ? "default" : "outline"}
      className="h-auto w-full justify-start whitespace-normal px-4 py-3 text-left"
      aria-labelledby={`${id}-title`}
      aria-describedby={`${id}-description`}
      onClick={onClick}
    >
      <span className="flex flex-col gap-0.5">
        <span id={`${id}-title`} className="text-sm font-medium">
          {title}
        </span>
        <span id={`${id}-description`} className="text-xs font-normal opacity-80">
          {description}
        </span>
      </span>
    </Button>
  );
}

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
    <OptionButton title="Use a different email" description="Sign in with another address." onClick={onUseAnotherEmail} />
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
        <OptionButton title="Contact support" description="General help." onClick={() => setView("support")} />
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
            This account gets a fresh wallet. The current wallet&apos;s contents won&apos;t show up in the new one
            automatically.
          </p>
        </div>
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
      <p className="text-sm text-muted-foreground">The account is ready. This device needs the recovery key to open it.</p>
      <div className="space-y-2.5">
        <OptionButton
          primary
          title="Use the recovery key"
          description="Paste the key to restore the account and everything in it."
          onClick={() => setView("key")}
        />
        <OptionButton
          title="Start a new wallet"
          description="Creates a fresh wallet for this account."
          onClick={() => setView("new-wallet")}
        />
        {anotherEmail}
        <OptionButton title="Contact support" description="General help." onClick={() => setView("support")} />
      </div>
    </div>
  );
}
