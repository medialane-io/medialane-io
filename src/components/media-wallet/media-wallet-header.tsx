"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import useSWR from "swr";
import { CurrencyIcon, LevelBadge } from "@medialane/ui";
import { useCreatorProfile } from "@/hooks/use-profiles";
import { useMyUsernameClaim } from "@/hooks/use-username-claims";
import { useSiwsToken } from "@/hooks/use-siws-token";
import { useRewards } from "@/hooks/use-rewards";
import { getMedialaneClient } from "@/lib/medialane-client";
import { resolveTokenImage } from "@/lib/utils";
import { short } from "@/lib/wallet-format";

export function MediaWalletHeader({ address, onNavigate }: { address: string; onNavigate: () => void }) {
  const { profile } = useCreatorProfile(address);
  const { username } = useMyUsernameClaim();
  const { getValidToken } = useSiwsToken();
  const { data: rewards } = useRewards(address);
  const [copied, setCopied] = useState(false);
  const avatarUrl = resolveTokenImage(profile?.avatarImage);

  // Only reads an already-cached SIWS token — never triggers a sign-in
  // prompt just from opening the wallet panel.
  const { data: wallet } = useSWR(
    ["media-wallet-header-email", address],
    async () => {
      const token = getValidToken();
      if (!token) return null;
      return getMedialaneClient().api.getMyWallet(token);
    },
    { revalidateOnFocus: false, shouldRetryOnError: false }
  );

  const copy = () => {
    navigator.clipboard?.writeText(address).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const headline = username ? `@${username}` : short(address);
  const verifiedEmail = wallet?.emailVerified ? wallet.email : null;

  return (
    <header className="flex flex-col items-center gap-2 pt-1">
      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full bg-foreground/[0.06] ring-2 ring-foreground/10">
        <Image
          src={avatarUrl ?? "/icon.png"}
          alt=""
          fill
          unoptimized
          className={avatarUrl ? "object-cover" : "object-cover p-[16%]"}
        />
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={copy}
          className="font-[family-name:var(--font-display)] text-lg font-bold tracking-tight"
        >
          {headline}
          {copied && <span className="ml-1.5 text-[10px] font-normal text-muted-foreground">copied ✓</span>}
        </button>
        <Link
          href="/settings"
          onClick={onNavigate}
          aria-label="Settings"
          className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-foreground/[0.06] transition-transform active:scale-95"
        >
          <CurrencyIcon symbol="STRK" size={16} />
        </Link>
      </div>
      {(rewards || verifiedEmail) && (
        <div className="flex items-center gap-2">
          {rewards && (
            <LevelBadge level={rewards.currentLevel} name={rewards.currentLevelName} badgeColor={rewards.badgeColor} size="sm" />
          )}
          {verifiedEmail && <span className="text-xs text-muted-foreground">{verifiedEmail}</span>}
        </div>
      )}
    </header>
  );
}
