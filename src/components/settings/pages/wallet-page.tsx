"use client";

import { AddressDisplay, ExportKeySection, AccountSection, useMediaWallet } from "@medialane/ui";
import { useState } from "react";
import { ArrowUpRight, RefreshCw, Wallet } from "lucide-react";
import { Badge } from "@medialane/ui/badge";
import { Button } from "@medialane/ui/button";
import { SettingsGate, SettingsPage } from "@/components/settings/settings-page";
import { useWalletNativeSession } from "@/hooks/use-wallet-native-session";
import { EXPLORER_URL } from "@/lib/constants";
import { ReplaceWalletDialog } from "@/components/wallet/replace-wallet-dialog";
import { unlockOwnerKey } from "@/lib/wallet/passkey";
import { loadSealedOwner } from "@/lib/wallet/store";

export default function WalletSettingsPage() {
  const { address } = useWalletNativeSession();
  const { open: openWalletPanel } = useMediaWallet();
  const [replaceOpen, setReplaceOpen] = useState(false);

  return (
    <SettingsGate>
      <SettingsPage title="Wallet" subtitle="Account secured onchain" icon={<Wallet className="h-4 w-4 text-white" />}>
        <AccountSection
          icon={Wallet}
          iconColor="text-violet-600 dark:text-violet-400"
          iconBg="bg-violet-500/10"
          title="Media Wallet"
          description="Account secured with immutable smart contracts and self-custodial wallet."
        >
          {address ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <AddressDisplay address={address} chars={33} showCopy className="break-all" />
                <Badge variant="outline" className="text-2xs">
                  Starknet
                </Badge>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button onClick={() => openWalletPanel()} variant="outline" size="sm">
                  <Wallet className="mr-1.5 h-3.5 w-3.5" />
                  Open wallet
                </Button>
                <Button asChild variant="outline" size="sm">
                  <a href={`${EXPLORER_URL}/contract/${address}`} target="_blank" rel="noopener noreferrer">
                    View on Voyager
                    <ArrowUpRight className="ml-1.5 h-3.5 w-3.5" />
                  </a>
                </Button>
              </div>
            </>
          ) : null}
        </AccountSection>

        {address ? (
          <div className="rounded-2xl border border-border/60 bg-card p-5 sm:p-6">
            <ExportKeySection loadSealed={loadSealedOwner} unlock={unlockOwnerKey} />
          </div>
        ) : null}

        <AccountSection
          icon={RefreshCw}
          iconColor="text-destructive"
          iconBg="bg-destructive/10"
          title="Generate New Wallet"
          description="This permanently replaces the active wallet on this account. This cannot be undone, make sure to transfer your assets before replace the wallet."
        >
          <Button onClick={() => setReplaceOpen(true)} variant="destructive" size="sm">
            Generate a new wallet
          </Button>
        </AccountSection>

        <ReplaceWalletDialog open={replaceOpen} onOpenChange={setReplaceOpen} />
      </SettingsPage>
    </SettingsGate>
  );
}
