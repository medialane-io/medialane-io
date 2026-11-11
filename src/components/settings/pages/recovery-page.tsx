"use client";

import { useState } from "react";
import { AccountSection, ExportKeySection } from "@medialane/ui";
import { Button } from "@medialane/ui/button";
import { KeyRound, LifeBuoy, LogIn } from "lucide-react";
import { RecoverySection } from "@/components/settings/recovery-section";
import { SettingsGate, SettingsPage } from "@/components/settings/settings-page";
import { RecoverWalletDialog } from "@/components/wallet/recover-wallet-dialog";
import { useWalletNativeSession } from "@/hooks/use-wallet-native-session";
import { unlockOwnerKey } from "@/lib/wallet/passkey";
import { loadSealedOwner } from "@/lib/wallet/store";

export default function RecoverySettingsPage() {
  const { address } = useWalletNativeSession();
  const [recoverOpen, setRecoverOpen] = useState(false);
  return (
    <SettingsGate>
      <SettingsPage
        title="Recovery"
        subtitle="How to get back in if you lose every device."
        icon={<LifeBuoy className="h-4 w-4 text-white" />}
      >
        {address ? (
          <AccountSection
            icon={KeyRound}
            iconColor="text-violet-600 dark:text-violet-400"
            iconBg="bg-violet-500/10"
            title="Your wallet key"
            description="Keep a copy so you can open this wallet on any browser."
          >
            <ExportKeySection
              loadSealed={loadSealedOwner}
              unlock={unlockOwnerKey}
            />
          </AccountSection>
        ) : null}
        <AccountSection
          icon={LogIn}
          iconColor="text-violet-600 dark:text-violet-400"
          iconBg="bg-violet-500/10"
          title="Recover with your key"
          description="Paste a recovery key to make its wallet the active wallet on this account."
        >
          <Button onClick={() => setRecoverOpen(true)} variant="outline" size="sm">
            Enter recovery key
          </Button>
        </AccountSection>
        {address ? <RecoverySection /> : null}
        <RecoverWalletDialog open={recoverOpen} onOpenChange={setRecoverOpen} />
      </SettingsPage>
    </SettingsGate>
  );
}
