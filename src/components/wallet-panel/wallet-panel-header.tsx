"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { CurrencyIcon } from "@medialane/ui";
import { useCreatorProfile } from "@/hooks/use-profiles";
import { resolveTokenImage } from "@/lib/utils";
import { short } from "@/lib/wallet-format";

/**
 * Ported from media-wallet's WalletHeader — the identity row at the top of
 * the wallet home screen. Two adaptations from source:
 * - Always reads "Media Wallet" as the label instead of a per-user nickname
 *   (media-wallet's own local appearance-nickname store has no io
 *   equivalent, and the creator-profile displayName is a different, public
 *   identity concept — not what this label is for).
 * - The avatar is io's equivalent of media-wallet's theme-image concept:
 *   the same NFT a user picks in Settings → Profile → "Avatar & app theme"
 *   (`profile.avatarImage`), falling back to the Medialane app icon —
 *   matching media-wallet's own `WalletAvatar` (art ?? app icon) exactly,
 *   both apps share the same visual aesthetic here by design.
 * - Trailing link shows the Starknet glyph (like media-wallet's own header),
 *   not a generic settings gear, still routing to /settings.
 */
export function WalletPanelHeader({ address, onNavigate }: { address: string; onNavigate: () => void }) {
  const { profile } = useCreatorProfile(address);
  const [copied, setCopied] = useState(false);
  const avatarUrl = resolveTokenImage(profile?.avatarImage);

  const copy = () => {
    navigator.clipboard?.writeText(address).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    // pr-12 keeps this row's trailing icon clear of the overlay's close
    // button, which floats fixed over the top-right corner of the panel.
    <header className="flex items-center gap-3 pr-12">
      <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full bg-foreground/[0.06]">
        <Image
          src={avatarUrl ?? "/icon.png"}
          alt=""
          fill
          unoptimized
          className={avatarUrl ? "object-cover" : "object-cover p-[12%]"}
        />
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate font-[family-name:var(--font-display)] text-lg font-bold tracking-tight">
          Media Wallet
        </div>
        <button onClick={copy} className="mt-0.5 flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
          {short(address)}
          {copied && <span className="text-[10px]">· copied ✓</span>}
        </button>
      </div>
      <Link
        href="/settings"
        onClick={onNavigate}
        aria-label="Settings"
        className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-foreground/[0.06] transition-transform active:scale-95"
      >
        <CurrencyIcon symbol="STRK" size={20} />
      </Link>
    </header>
  );
}
