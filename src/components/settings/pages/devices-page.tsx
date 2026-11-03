"use client";

import { Smartphone } from "lucide-react";
import { DevicesSection } from "@/components/settings/devices-section";
import { SignOutOtherDevices } from "@/components/settings/sign-out-other-devices";
import { SettingsGate, SettingsPage } from "@/components/settings/settings-page";
import { useWalletNativeSession } from "@/hooks/use-wallet-native-session";

export default function DevicesSettingsPage() {
  const { address } = useWalletNativeSession();
  return (
    <SettingsGate>
      <SettingsPage
        title="Devices"
        subtitle="The devices that can sign for your account."
        icon={<Smartphone className="h-4 w-4 text-white" />}
      >
        {address ? <DevicesSection walletAddress={address} /> : null}
        <SignOutOtherDevices />
      </SettingsPage>
    </SettingsGate>
  );
}
