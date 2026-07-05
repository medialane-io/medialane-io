"use client";

import Link from "next/link";
import { AddressDisplay } from "@/components/shared/address-display";
import { LeaderboardWidget } from "@medialane/ui";
import { useLeaderboard } from "@/hooks/use-rewards";

export function TopCreators() {
  const { data, isLoading } = useLeaderboard(1, 5);
  if (isLoading || !data || data.data.length === 0) return null;

  return (
    <LeaderboardWidget
      entries={data.data}
      title="Top Creators"
      href="/rewards"
      renderAddress={(address) => (
        <Link href={`/account/${address}`} className="hover:text-primary transition-colors">
          <AddressDisplay address={address} chars={5} showCopy={false} />
        </Link>
      )}
    />
  );
}
