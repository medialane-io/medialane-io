"use client";

import { useId, useState } from "react";
import { Clock, Loader2 } from "lucide-react";
import { Button } from "@medialane/ui/button";
import { useSession } from "@medialane/ui/utils/use-session";
import { useFormat, useT } from "@medialane/ui/i18n";
import { RecoveryKeyRestore } from "@/components/wallet/recovery-key-restore";
import { useEmailRecovery } from "@/components/wallet/use-email-recovery";
import { AccountHeading } from "./account-card";
import { SupportForm } from "./support-form";

const OPTION_CLASS = "h-auto w-full whitespace-normal py-3";

function OptionButton({
  title,
  description,
  primary,
  busy,
  disabled,
  onClick,
}: {
  title: string;
  description: string;
  primary?: boolean;
  busy?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  const id = useId();
  return (
    <Button
      variant={primary ? "default" : "soft"}
      className="h-auto w-full justify-start whitespace-normal px-4 py-3 text-left"
      aria-labelledby={`${id}-title`}
      aria-describedby={`${id}-description`}
      disabled={disabled}
      onClick={onClick}
    >
      <span className="flex flex-1 flex-col gap-0.5">
        <span id={`${id}-title`} className="text-sm font-medium">
          {title}
        </span>
        <span id={`${id}-description`} className="text-xs font-normal opacity-80">
          {description}
        </span>
      </span>
      {busy && <Loader2 className="h-4 w-4 shrink-0 animate-spin" />}
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
  const t = useT();
  const intl = useFormat();
  const { session } = useSession();
  const recovery = useEmailRecovery(session?.walletAddress ?? undefined, onRecovered);
  const { status, mine, waitDays, busy, error } = recovery;
  const [view, setView] = useState<View>("options");
  const back = () => setView("options");
  const welcome = t("Welcome back");

  if (status === undefined) {
    return (
      <div className="w-full space-y-6">
        <AccountHeading title={welcome} />
        <div className="flex w-full items-center justify-center gap-2 py-2.5 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          {t("Checking account…")}
        </div>
      </div>
    );
  }

  if (mine && status?.state === "ready") {
    return (
      <div className="w-full space-y-6">
        <AccountHeading title={t("Account ready")} />
        <div className="space-y-3">
          <Button size="lg" onClick={recovery.finish} disabled={busy} className="w-full">
            {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t("Open account")}
          </Button>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
      </div>
    );
  }

  if (mine && status?.readyAt) {
    return (
      <div className="w-full space-y-6">
        <AccountHeading
          icon={<Clock />}
          title={t("Recovery started")}
          description={t("Account will be available on {value}.", {
            value: intl.date(status.readyAt * 1000, { month: "short", day: "numeric" }),
          })}
        />
        <div className="space-y-3 text-center text-sm text-muted-foreground">
          <p>{t("Medialane accounts are smart contracts owned by their holders. No one else can access them, not even Medialane.")}</p>
          <p>
            {t.plural("A {count}-day wait keeps every recovery secure.", "A {count}-day wait keeps every recovery secure.", waitDays)}{" "}
            {t("An email arrives when the account is ready.")}
          </p>
        </div>
      </div>
    );
  }

  if (view === "support") {
    return (
      <div className="w-full space-y-6">
        <AccountHeading title={welcome} />
        <SupportForm onBack={back} />
      </div>
    );
  }

  if (view === "key") {
    return (
      <div className="w-full space-y-6">
        <AccountHeading title={welcome} />
        <div className="space-y-4">
          <RecoveryKeyRestore onRestored={onRecovered} />
          <Button variant="ghost" className="w-full" onClick={back}>
            {t("Back")}
          </Button>
        </div>
      </div>
    );
  }

  if (view === "new-wallet") {
    return (
      <div className="w-full space-y-6">
        <AccountHeading title={welcome} />
        <div className="space-y-4">
          <div className="space-y-1">
            <p className="text-sm font-medium">{t("Start a new wallet?")}</p>
            <p className="text-sm text-muted-foreground">
              {t("This account gets a fresh wallet. Everything in the current wallet stays there.")}
            </p>
          </div>
          <Button variant="soft" className={OPTION_CLASS} onClick={onStartNew}>
            {t("Start a new wallet")}
          </Button>
          <Button variant="ghost" className="w-full" onClick={back}>
            {t("Cancel")}
          </Button>
        </div>
      </div>
    );
  }

  const emailDescription =
    status && status.state !== "none"
      ? t("Replaces the recovery already started.")
      : t.plural("Available in {count} day.", "Available in {count} days.", waitDays);

  return (
    <div className="w-full space-y-6">
      <AccountHeading title={welcome} description={t("Choose how to open the account on this device.")} />
      <div className="space-y-2.5">
        <OptionButton
          primary
          title={t("Use recovery key")}
          description={t("Opens right away.")}
          disabled={busy}
          onClick={() => setView("key")}
        />
        {status?.enabled ? (
          <OptionButton
            title={t("Recover with email")}
            description={emailDescription}
            busy={busy}
            disabled={busy}
            onClick={recovery.start}
          />
        ) : (
          <OptionButton
            title={t("Start a new wallet")}
            description={t("Creates a fresh wallet for this account.")}
            onClick={() => setView("new-wallet")}
          />
        )}
        <OptionButton
          title={t("Use a different email")}
          description={t("Sign in with another address.")}
          disabled={busy}
          onClick={onUseAnotherEmail}
        />
        <OptionButton title={t("Contact support")} description={t("General help.")} disabled={busy} onClick={() => setView("support")} />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
