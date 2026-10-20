"use client";

import { ImageIcon, LifeBuoy, Mail, Smartphone, User, Wallet } from "lucide-react";
import { AccountStatus } from "@/components/settings/account-status";
import { PortfolioSnapshot, RewardsSnapshot } from "@/components/settings/snapshots";
import { SettingsGate, SettingsGroup, SettingsPage, SettingsRow } from "@/components/settings/settings-page";
import { useAccountEmail } from "@/hooks/use-account-email";
import { useCollectionsByOwner, useUserOrders } from "@medialane/ui";

import { useTokensByOwner } from "@/hooks/use-tokens";

import { useSecurityStatus } from "@/hooks/use-security-status";
import { useMyUsernameClaim } from "@/hooks/use-username-claims";
import { useWalletNativeSession } from "@/hooks/use-wallet-native-session";
import { emailRow, usernameRow, walletRow } from "@/lib/settings/rows";

export default function SettingsHomePage() {
  const { address, isDeployed } = useWalletNativeSession();
  const { status: email } = useAccountEmail();
  const { username, claim } = useMyUsernameClaim();
  const { tokens } = useTokensByOwner(address ?? null, 1, 100);
  const { orders } = useUserOrders(address ?? null);
  const { collections } = useCollectionsByOwner(address ?? null);
  const { devices, guardians } = useSecurityStatus(address);

  const activeListings = orders.filter((o) => o.status === "ACTIVE" && o.offer.itemType !== "ERC20");
  return (
    <SettingsGate>
      <SettingsPage
        title="Settings"
        subtitle="Your public profile and your account."
        back={false}
        aside={
          <>
            <AccountStatus address={address} email={email} walletDeployed={isDeployed} devices={devices} guardians={guardians} />
            <PortfolioSnapshot assets={tokens.length} listings={activeListings.length} collections={collections.length} />
            <RewardsSnapshot address={address} />
          </>
        }
      >
        <SettingsGroup label="Account">
          <SettingsRow href="/settings/email" icon={Mail} label="Email" status={emailRow(email)} />
          <SettingsRow href="/settings/wallet" icon={Wallet} label="Wallet" status={walletRow(isDeployed)} />
        </SettingsGroup>

        <SettingsGroup label="Security">
          <SettingsRow href="/settings/devices" icon={Smartphone} label="Devices" />
          <SettingsRow href="/settings/recovery" icon={LifeBuoy} label="Recovery" />
        </SettingsGroup>

        <SettingsGroup label="Profile">
          <SettingsRow
            href="/settings/profile"
            icon={User}
            label="Username, name & links"
            status={usernameRow(username, claim?.status ?? null)}
          />
          <SettingsRow href="/settings/appearance" icon={ImageIcon} label="Avatar & theme" />
        </SettingsGroup>
      </SettingsPage>
    </SettingsGate>
  );
}
