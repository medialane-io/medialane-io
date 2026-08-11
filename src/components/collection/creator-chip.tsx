"use client";

import Link from "next/link";
import { useCreatorProfile } from "@/hooks/use-profiles";
import { AddressDisplay } from "@/components/shared/address-display";

export function CreatorChip({ address }: { address: string }) {
  const { profile } = useCreatorProfile(address);
  const label = profile?.displayName || profile?.username || null;

  return (
    <Link
      href={`/account/${address}`}
      className="inline-flex items-center gap-1.5 text-sm rounded-full px-2 py-1 hover:bg-muted/60 active:scale-[0.98] transition"
    >
      <span className="text-muted-foreground shrink-0">by</span>
      {label ? (
        <span className="font-semibold text-foreground truncate">{label}</span>
      ) : (
        <AddressDisplay address={address} chars={6} showCopy={false} className="font-semibold text-foreground" />
      )}
    </Link>
  );
}
