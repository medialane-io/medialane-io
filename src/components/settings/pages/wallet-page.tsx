"use client";

import { AddressDisplay, ExportKeySection, AccountSection, useMediaWallet } from "@medialane/ui";
import { ArrowUpRight, ShieldAlert, ShieldCheck, Wallet } from "lucide-react";
import { Badge } from "@medialane/ui/badge";
import { Button } from "@medialane/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { SettingsGate, SettingsPage } from "@/components/settings/settings-page";
import { useWalletNativeSession } from "@/hooks/use-wallet-native-session";
import { EXPLORER_URL } from "@/lib/constants";
import { unlockOwnerKey } from "@/lib/wallet/passkey";
import { loadSealedOwner } from "@/lib/wallet/store";

export default function WalletSettingsPage() {
  const { address, isDeployed } = useWalletNativeSession();
  const { open: openWalletPanel } = useMediaWallet();

  return (
    <SettingsGate>
      <SettingsPage title="Wallet" subtitle="Where your assets live." icon={<Wallet className="h-4 w-4 text-white" />}>
        <AccountSection
          icon={Wallet}
          iconColor="text-violet-600 dark:text-violet-400"
          iconBg="bg-violet-500/10"
          title="Wallet"
          description="Only you control this wallet. Medialane sponsors your transactions but never holds your keys."
        >
          {address ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <AddressDisplay address={address} chars={6} showCopy />
                <Tooltip>
                  <TooltipTrigger asChild>
                    {isDeployed === false ? (
                      <Badge variant="outline" className="cursor-default gap-1 border-yellow-500/40 bg-yellow-500/10 text-2xs text-yellow-700 dark:text-yellow-400">
                        <ShieldAlert className="h-3 w-3" /> Deploying
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="cursor-default gap-1 border-emerald-500/40 bg-emerald-500/10 text-2xs text-emerald-600 dark:text-emerald-400">
                        <ShieldCheck className="h-3 w-3" /> Deployed
                      </Badge>
                    )}
                  </TooltipTrigger>
                  <TooltipContent className="max-w-[220px] text-xs">
                    {isDeployed === false
                      ? "Your wallet address is reserved. It finishes setting up onchain automatically with your first transaction."
                      : "Your wallet is live onchain and ready to use."}
                  </TooltipContent>
                </Tooltip>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <Button onClick={() => openWalletPanel()} variant="outline" size="sm">
                  <Wallet className="mr-1.5 h-3.5 w-3.5" />
                  Open wallet
                </Button>
                <a
                  href={`${EXPLORER_URL}/contract/${address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                >
                  View on Voyager
                  <ArrowUpRight className="h-3 w-3" />
                </a>
              </div>

              <ExportKeySection
                loadSealed={loadSealedOwner}
                unlock={unlockOwnerKey}
              />
            </>
          ) : null}
        </AccountSection>
      </SettingsPage>
    </SettingsGate>
  );
}
