"use client";

import { ServiceFormShell } from "@medialane/ui";
import Link from "next/link";
import type { ElementType, ReactNode } from "react";
import { ArrowLeft, ChevronRight, Settings as SettingsIcon, Wallet } from "lucide-react";
import { Button } from "@medialane/ui/button";
import { Skeleton } from "@medialane/ui/skeleton";
import { useWalletNativeSession } from "@/hooks/use-wallet-native-session";
import { cn } from "@/lib/utils";
import type { RowStatus, RowTone } from "@/lib/settings/rows";

export function SettingsPage({
  title,
  subtitle = "",
  icon,
  aside,
  back = true,
  children,
}: {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  aside?: ReactNode;
  back?: boolean;
  children: ReactNode;
}) {
  return (
    <ServiceFormShell
      icon={icon ?? <SettingsIcon className="h-4 w-4 text-white" />}
      title={title}
      subtitle={subtitle}
      aside={aside}
      backSlot={
        back ? (
          <Link href="/settings" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
        ) : undefined
      }
    >
      {children}
    </ServiceFormShell>
  );
}

export function SettingsGate({ children }: { children: ReactNode }) {
  const { hasWallet } = useWalletNativeSession();
  if (hasWallet) return <>{children}</>;
  return (
    <div className="space-y-4 px-4 py-24 text-center">
      <Wallet className="mx-auto h-12 w-12 text-muted-foreground" />
      <h1 className="text-2xl font-bold">Secure your account</h1>
      <p className="mx-auto max-w-sm text-muted-foreground">Secure your account to manage your creator settings.</p>
      <div className="btn-border-animated inline-block rounded-lg p-[1px]">
        <Button
          asChild
          className="rounded-[7px] bg-transparent text-white transition-all hover:bg-transparent hover:brightness-110 active:scale-[0.98]"
        >
          <Link href="/connect?redirect_url=/settings">Get started</Link>
        </Button>
      </div>
    </div>
  );
}

export function SettingsSection({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon?: ElementType;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div>
        <h3 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
          {Icon ? <Icon className="h-4 w-4" /> : null}
          {title}
        </h3>
        {description ? <p className="mt-0.5 text-xs text-muted-foreground">{description}</p> : null}
      </div>
      <div className="space-y-4 border-t border-border pt-4">{children}</div>
    </section>
  );
}

export function SettingsGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section className="space-y-2">
      <h3 className="text-sm font-semibold text-foreground">{label}</h3>
      <div className="divide-y divide-border border-y border-border">{children}</div>
    </section>
  );
}

const TONE: Record<RowTone, string> = {
  ok: "text-emerald-600 dark:text-emerald-400",
  warn: "text-yellow-700 dark:text-yellow-400",
  muted: "text-muted-foreground",
};

export function SettingsRow({
  href,
  icon: Icon,
  label,
  status,
}: {
  href: string;
  icon: ElementType;
  label: string;
  status?: RowStatus | null;
}) {
  return (
    <Link href={href} className="flex min-h-14 items-center gap-3 py-3 transition-colors hover:text-primary">
      <Icon className="h-5 w-5 shrink-0 text-muted-foreground" />
      <span className="flex-1 text-sm font-medium text-foreground">{label}</span>
      {status === undefined ? null : status === null ? (
        <Skeleton className="h-4 w-16" />
      ) : (
        <span className={cn("text-sm", TONE[status.tone])}>{status.value}</span>
      )}
      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
    </Link>
  );
}
