"use client";

import { useRouter } from "next/navigation";
import { NavWalletTrigger as SharedNavWalletTrigger } from "@medialane/ui";
import { useWalletNativeSession } from "@/hooks/use-wallet-native-session";
import { useWalletPanel } from "@/components/wallet-panel/wallet-panel-overlay";
import { UserShieldIcon } from "@/components/icons/user-shield-icon";

export function HeaderWalletTrigger() {
  const { hasWallet, isDeployed } = useWalletNativeSession();
  const { open } = useWalletPanel();
  const router = useRouter();

  const handleClick = () => {
    if (!hasWallet) {
      router.push("/connect");
    } else if (isDeployed === false) {
      router.push("/wallet-onboarding");
    } else {
      open();
    }
  };

  const icon = <UserShieldIcon className="h-[18px] w-[18px]" style={{ color: "hsl(var(--brand-blue))" }} />;

  return (
    <SharedNavWalletTrigger
      connected={hasWallet}
      disconnectedIcon={icon}
      connectedIcon={icon}
      onClick={handleClick}
    />
  );
}
