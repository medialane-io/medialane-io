"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Wallet } from "lucide-react";
import { OpenInDappCallout } from "./open-in-dapp-callout";

interface SignedOutAssetActionsProps {
  /** Chain of the asset (e.g. "STARKNET") — passed through to the dapp bridge. */
  chain: string;
  contract: string;
  tokenId: string;
}

/**
 * Balanced 2-column entry point for visitors without a wallet yet: a
 * wallet-setup prompt on the left (works the same regardless of the asset's
 * chain) and the chain-native dapp bridge on the right (already
 * parameterized by `chain` in OpenInDappCallout) — the two ways to trade an
 * asset as medialane.io adds more chains.
 */
export function SignedOutAssetActions({ chain, contract, tokenId }: SignedOutAssetActionsProps) {
  const pathname = usePathname();
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-stretch">
      <Link
        href={`/connect?redirect_url=${encodeURIComponent(pathname)}`}
        className="group flex h-full w-full items-start gap-3 rounded-2xl border border-transparent bg-gradient-to-br from-brand-blue/15 via-brand-purple/10 to-transparent p-4 text-left transition-colors hover:border-brand-purple/30"
      >
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-blue to-brand-purple text-white">
          <Wallet className="h-[18px] w-[18px]" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold leading-snug">Set up account</p>
          <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
            Buy, offer, and collect instantly — no seed phrase needed.
          </p>
        </div>
      </Link>

      <OpenInDappCallout chain={chain} contract={contract} tokenId={tokenId} />
    </div>
  );
}
