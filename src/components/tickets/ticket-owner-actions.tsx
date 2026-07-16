"use client";

// The ip-tickets service action on the collection page — one featured button,
// visible only to the collection owner, in the right owner cluster (the same
// slot erc1155 collections use for "Mint editions"). Links to the dedicated
// manage page (create + mint, both full page content — no popup panels).

import Link from "next/link";
import { Ticket } from "lucide-react";
import { useWallet } from "@/hooks/use-wallet";

export function TicketOwnerActions({
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
        href={`/launchpad/tickets/${contractAddress}/manage`}
        className="flex items-center gap-2 h-10 px-5 rounded-[11px] text-sm font-semibold text-white bg-transparent hover:brightness-110 active:scale-[0.98] transition"
      >
        <Ticket className="h-4 w-4" />
        Mint tickets
      </Link>
    </div>
  );
}
