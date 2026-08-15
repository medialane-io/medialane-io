"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useCreatorProfile } from "@/hooks/use-profiles";
import { useMyUsernameClaim } from "@/hooks/use-username-claims";
import { resolveTokenImage } from "@/lib/utils";
import { short } from "@/lib/wallet-format";

export function MediaWalletHeader({ address, onNavigate }: { address: string; onNavigate: () => void }) {
  const { profile } = useCreatorProfile(address);
  const { username } = useMyUsernameClaim();
  const [copied, setCopied] = useState(false);
  const avatarUrl = resolveTokenImage(profile?.avatarImage);

  const copy = () => {
    navigator.clipboard?.writeText(address).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const headline = username ? `@${username}` : short(address);

  return (
    <header className="flex flex-col items-center gap-2 pt-1">
      <Link
        href="/settings"
        onClick={onNavigate}
        aria-label="Settings"
        className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full bg-foreground/[0.06] ring-2 ring-foreground/10 transition-transform active:scale-95"
      >
        <Image
          src={avatarUrl ?? "/icon.png"}
          alt=""
          fill
          unoptimized
          className={avatarUrl ? "object-cover" : "object-cover p-[16%]"}
        />
      </Link>
      <button
        onClick={copy}
        className="font-[family-name:var(--font-display)] text-lg font-bold tracking-tight"
      >
        {headline}
        {copied && <span className="ml-1.5 text-[10px] font-normal text-muted-foreground">copied ✓</span>}
      </button>
    </header>
  );
}
