"use client";

import { useRouter } from "next/navigation";
import { NavWalletTrigger as SharedNavWalletTrigger, useMediaWallet, useCreatorProfile } from "@medialane/ui";

import { useWalletNativeSession } from "@/hooks/use-wallet-native-session";

import { UserShieldIcon } from "@/components/icons/user-shield-icon";

import { resolveTokenImage } from "@/lib/utils";

export function HeaderWalletTrigger() {
  const { address, hasWallet } = useWalletNativeSession();
  const { open } = useMediaWallet();
  const router = useRouter();
  const { profile } = useCreatorProfile(address ?? undefined);
  const avatarUrl = resolveTokenImage(profile?.avatarImage);

  const handleClick = () => {
    if (!hasWallet) {
      router.push("/connect");
    } else {
      open();
    }
  };

  const icon = <UserShieldIcon className="h-[18px] w-[18px]" style={{ color: "hsl(var(--brand-blue))" }} />;

  return (
    <SharedNavWalletTrigger
      connected={hasWallet}
      iconSrc={hasWallet ? avatarUrl ?? undefined : undefined}
      disconnectedIcon={icon}
      connectedIcon={icon}
      onClick={handleClick}
    />
  );
}
