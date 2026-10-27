"use client";

import { AccountSection, ExportKeySection, describeError } from "@medialane/ui";
import { KeyRound, LifeBuoy } from "lucide-react";
import { GuardianRecoverySection } from "@/components/settings/guardian-recovery-section";
import { SettingsGate, SettingsPage } from "@/components/settings/settings-page";
import { useWalletNativeSession } from "@/hooks/use-wallet-native-session";
import { unlockOwnerKey } from "@/lib/wallet/passkey";
import { loadSealedOwner } from "@/lib/wallet/store";

export default function RecoverySettingsPage() {
  const { address } = useWalletNativeSession();
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
              describeError={(err, fallback) => describeError(err, fallback).message}
            />
          </AccountSection>
        ) : null}
        {address ? <GuardianRecoverySection walletAddress={address} /> : null}
      </SettingsPage>
    </SettingsGate>
  );
}
