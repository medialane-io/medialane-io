"use client";

import { LevelBadge, MediaWalletOverlay, type MediaWalletHeaderIdentity } from "@medialane/ui";
import { useWalletNativeSession } from "@/hooks/use-wallet-native-session";
import { useWalletWriteAction } from "@/hooks/use-wallet-write-action";
import { useEmailVerificationStatus } from "@/hooks/use-email-verification-required";
import { useCreatorProfile } from "@/hooks/use-profiles";
import { useMyUsernameClaim } from "@/hooks/use-username-claims";
import { useRewards } from "@/hooks/use-rewards";
import { useSession } from "@/hooks/use-session";
import { mediaWallet } from "@/lib/wallet/client";
import { resolveTokenImage } from "@/lib/utils";
import { EXPLORER_URL } from "@/lib/constants";
import { emailBannerText } from "@/lib/settings/rows";

const EMAIL_BANNER = { href: "/verify", text: emailBannerText };
const EXTERNAL_WALLET = { href: "https://starknet.medialane.io", label: "Use another wallet" };

function useAccountEmail(): string | null {
  return useSession().session?.email ?? null;
}

function useHeaderIdentity(address: string): MediaWalletHeaderIdentity {
  const { profile } = useCreatorProfile(address);
  const { username } = useMyUsernameClaim();
  const { data: rewards } = useRewards(address);
  return {
    avatarUrl: resolveTokenImage(profile?.avatarImage),
    headline: username ? `@${username}` : undefined,
    badge: rewards ? (
      <LevelBadge
        level={rewards.currentLevel}
        name={rewards.currentLevelName}
        badgeColor={rewards.badgeColor}
        size="sm"
        className="absolute -bottom-2 -right-4 shadow-md"
      />
    ) : undefined,
  };
}

export function MediaWalletApp() {
  return (
    <MediaWalletOverlay
      wallet={mediaWallet}
      resolveImage={resolveTokenImage}
      explorerUrl={EXPLORER_URL}
      emailBanner={EMAIL_BANNER}
      externalWallet={EXTERNAL_WALLET}
      useWalletSession={useWalletNativeSession}
      useWriteAction={useWalletWriteAction}
      useEmailStatus={useEmailVerificationStatus}
      useAccountEmail={useAccountEmail}
      useHeaderIdentity={useHeaderIdentity}
    />
  );
}
