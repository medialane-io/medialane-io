"use client";

// The ip-club service action on the collection page — one featured button,
// visible only to the collection owner, in the right owner cluster (the same
// slot erc1155 collections use for "Mint editions"). Links to the dedicated
// mint page (create a membership tier + mint its supply, same shape as the
// IP Tickets mint page).

import Link from "next/link";
import { Users } from "lucide-react";
import { useWallet } from "@/hooks/use-wallet";

export function ClubOwnerActions({
  contractAddress,
  owner,
}: {
  contractAddress: string;
  owner?: string | null;
}) {
  const { address } = useWallet();

  const isOwner =
    !!address && !!owner && owner.toLowerCase() === address.toLowerCase();
  if (!isOwner) return null;

  return (
    <div className="btn-border-animated p-[1px] rounded-xl">
      <Link
        href={`/launchpad/club/${contractAddress}/mint`}
        className="flex items-center gap-2 h-10 px-5 rounded-[11px] text-sm font-semibold text-white bg-transparent hover:brightness-110 active:scale-[0.98] transition"
      >
        <Users className="h-4 w-4" />
        Create membership
      </Link>
    </div>
  );
}
