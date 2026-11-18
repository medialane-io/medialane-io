"use client";

import { Smartphone } from "lucide-react";
import { DevicesSection } from "@/components/settings/devices-section";
import { SignOutOtherDevices } from "@/components/settings/sign-out-other-devices";
import { SettingsGate, SettingsPage } from "@/components/settings/settings-page";
import { useWalletNativeSession } from "@/hooks/use-wallet-native-session";
import { useT } from "@medialane/ui/i18n";

export default function DevicesSettingsPage() {
  const t = useT();
  const { address } = useWalletNativeSession();
  return (
    <SettingsGate>
      <SettingsPage
        title={t("Devices")}
        subtitle={t("The devices that can sign for your account.")}
        icon={<Smartphone className="h-4 w-4 text-white" />}
      >
        {address ? <DevicesSection walletAddress={address} /> : null}
        <SignOutOtherDevices />
      </SettingsPage>
    </SettingsGate>
  );
}
