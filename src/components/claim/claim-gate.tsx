"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Wallet } from "lucide-react";
import { Button } from "@medialane/ui/button";
import { useWalletNativeSession } from "@/hooks/use-wallet-native-session";
import { connectHref } from "@/lib/connect-href";
import { useT } from "@medialane/ui/i18n";

export function ClaimGate({ children }: { children: ReactNode }) {
  const t = useT();
  const { hasWallet } = useWalletNativeSession();
  const pathname = usePathname();
  if (hasWallet) return <>{children}</>;
  return (
    <div className="space-y-3 rounded-xl border border-dashed border-border p-6 text-center">
      <Wallet className="mx-auto h-8 w-8 text-muted-foreground" />
      <p className="text-sm font-medium text-foreground">{t("Secure your account to make a claim")}</p>
      <p className="text-sm text-muted-foreground">{t("It only takes a moment, and you come right back here.")}</p>
      <Button asChild>
        <Link href={connectHref(pathname)}>{t("Get started")}</Link>
      </Button>
    </div>
  );
}
