"use client";

import { ImageIcon, LifeBuoy, Mail, Smartphone, User, Wallet } from "lucide-react";
import { AccountStatus } from "@/components/settings/account-status";
import { PortfolioSnapshot, RewardsSnapshot } from "@medialane/ui";
import { SettingsGate, SettingsGroup, SettingsPage, SettingsRow } from "@/components/settings/settings-page";
import { useAccountEmail } from "@/hooks/use-account-email";
import { useCollectionsByOwner, useTokensByOwner, useUserOrders } from "@medialane/ui";


import { useSecurityStatus } from "@/hooks/use-security-status";
import { useMyUsernameClaim } from "@/hooks/use-username-claims";
import { useWalletNativeSession } from "@/hooks/use-wallet-native-session";
import { emailRow, usernameRow, walletRow } from "@/lib/settings/rows";
import { useT } from "@medialane/ui/i18n";

export default function SettingsHomePage() {
  const t = useT();
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
        title={t("Settings")}
        subtitle={t("Your public profile and your account.")}
        back={false}
        aside={
          <>
            <AccountStatus address={address} email={email} walletDeployed={isDeployed} devices={devices} guardians={guardians} />
            <PortfolioSnapshot assets={tokens.length} listings={activeListings.length} collections={collections.length} />
            <RewardsSnapshot address={address} />
          </>
        }
      >
        <SettingsGroup label={t("Account")}>
          <SettingsRow href="/settings/email" icon={Mail} label={t("Email")} status={emailRow(email)} />
          <SettingsRow href="/settings/wallet" icon={Wallet} label={t("Wallet")} status={walletRow(isDeployed)} />
        </SettingsGroup>

        <SettingsGroup label={t("Security")}>
          <SettingsRow href="/settings/devices" icon={Smartphone} label={t("Devices")} />
          <SettingsRow href="/settings/recovery" icon={LifeBuoy} label={t("Recovery")} />
        </SettingsGroup>

        <SettingsGroup label={t("Profile")}>
          <SettingsRow
            href="/settings/profile"
            icon={User}
            label={t("Username, name & links")}
            status={usernameRow(username, claim?.status ?? null)}
          />
          <SettingsRow href="/settings/appearance" icon={ImageIcon} label={t("Avatar & theme")} />
        </SettingsGroup>
      </SettingsPage>
    </SettingsGate>
  );
}
