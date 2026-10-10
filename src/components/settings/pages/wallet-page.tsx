"use client";

import { AddressDisplay, ExportKeySection, UserFacingError, describeError } from "@medialane/ui";
import { useState } from "react";
import { AlertTriangle, ArrowUpRight, Loader2, ShieldAlert, ShieldCheck, Wallet } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { AccountSection } from "@/components/settings/account-section";
import { SettingsGate, SettingsPage } from "@/components/settings/settings-page";
import { WalletDeploymentDialog } from "@/components/wallet/wallet-deployment-dialog";
import { useMediaWallet } from "@/components/media-wallet/media-wallet-overlay";
import { useSession } from "@/hooks/use-session";
import { useWalletNativeSession } from "@/hooks/use-wallet-native-session";
import { EXPLORER_URL } from "@/lib/constants";
import { getMedialaneClient } from "@/lib/medialane-client";
import { mediaWallet } from "@/lib/wallet/client";
import { unlockOwnerKey } from "@/lib/wallet/passkey";
import { loadSealedOwner } from "@/lib/wallet/store";

export default function WalletSettingsPage() {
  const { address, isDeployed } = useWalletNativeSession();
  const { open: openWalletPanel } = useMediaWallet();
  const { session } = useSession();
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [resumeOpen, setResumeOpen] = useState(false);
  async function attachNewWallet(newWalletSiwsToken: string) {
    try {
      await getMedialaneClient().api.generateWallet(newWalletSiwsToken);
    } catch {
      throw new UserFacingError("Failed to switch to the new wallet");
    }
    window.location.reload();
  }

  async function handleGenerate() {
    const confirmed = window.confirm(
      "This permanently replaces your wallet. Every asset, listing, and transaction history " +
        "in this wallet stays behind and none of it moves to the new one. This cannot be undone.\n\n" +
        "Continue and generate a new wallet?",
    );
    if (!confirmed) return;
    setGenerating(true);
    setGenerateError(null);

    if (!session) {
      setGenerateError("Something went wrong. Please try again.");
      setGenerating(false);
      return;
    }

    try {
      const { siwsToken } = await mediaWallet.completeDeployment(() => {}, { forceNew: true });
      await attachNewWallet(siwsToken);
    } catch {
      setResumeOpen(true);
    } finally {
      setGenerating(false);
    }
  }

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
                      <Badge variant="outline" className="cursor-default gap-1 border-yellow-500/40 bg-yellow-500/10 text-[10px] text-yellow-700 dark:text-yellow-400">
                        <ShieldAlert className="h-3 w-3" /> Deploying
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="cursor-default gap-1 border-emerald-500/40 bg-emerald-500/10 text-[10px] text-emerald-600 dark:text-emerald-400">
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
                describeError={(err, fallback) => describeError(err, fallback).message}
              />
            </>
          ) : null}

          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-xs leading-relaxed">
              <span className="font-semibold">This permanently replaces your wallet.</span> Every asset, listing, and
              transaction history in this wallet stays behind — none of it moves to the new one, and this cannot be
              undone. Only do this if you didn&apos;t set this wallet up yourself, or you&apos;ve already moved your
              assets out and confirmed the transfer onchain.
            </AlertDescription>
          </Alert>
          {generateError ? <p className="text-sm text-destructive">{generateError}</p> : null}
          <Button onClick={handleGenerate} disabled={generating} variant="destructive" size="sm">
            {generating ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
            Generate a new wallet
          </Button>
        </AccountSection>

        <WalletDeploymentDialog
          open={resumeOpen}
          onOpenChange={setResumeOpen}
          onComplete={async ({ siwsToken }) => {
            await attachNewWallet(siwsToken);
          }}
        />
      </SettingsPage>
    </SettingsGate>
  );
}
