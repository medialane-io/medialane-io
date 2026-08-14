"use client";

import Link from "next/link";
import { Ticket } from "lucide-react";
import { normalizeAddress } from "@medialane/sdk";
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
    !!address && !!owner && normalizeAddress("STARKNET", owner) === normalizeAddress("STARKNET", address);
  if (!isOwner) return null;

  return (
    <div className="btn-border-animated p-[1px] rounded-xl">
      <Link
        href={`/launchpad/tickets/${contractAddress}/mint`}
        className="flex items-center gap-2 h-10 px-5 rounded-[11px] text-sm font-semibold text-white bg-transparent hover:brightness-110 active:scale-[0.98] transition"
      >
        <Ticket className="h-4 w-4" />
        Mint tickets
      </Link>
    </div>
  );
}
