"use client";

import { useState } from "react";
import Link from "next/link";
import { Settings, Wallet as WalletIcon } from "lucide-react";
import { useCreatorProfile } from "@/hooks/use-profiles";
import { short } from "@/lib/wallet-format";

/**
 * Ported from media-wallet's WalletHeader — the identity row shown at the
 * top of the wallet home screen (avatar, name, address, settings shortcut).
 * Adapted: media-wallet reads its own local appearance/display-name store;
 * io already has a creator profile for this exact purpose, so this reads
 * `displayName` from there instead, falling back to "Wallet" the same way
 * media-wallet falls back to its own app name.
 */
export function WalletPanelHeader({ address, onNavigate }: { address: string; onNavigate: () => void }) {
  const { profile } = useCreatorProfile(address);
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard?.writeText(address).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <header className="flex items-center gap-3">
      <div className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-full bg-foreground/[0.06]">
        <WalletIcon className="h-5 w-5 text-muted-foreground" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate font-[family-name:var(--font-display)] text-lg font-bold tracking-tight">
          {profile?.displayName || "Wallet"}
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
        <Settings className="h-4 w-4 text-muted-foreground" />
      </Link>
    </header>
  );
}
