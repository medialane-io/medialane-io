"use client";

// The ip-tickets service actions on the collection page — visible only to the
// collection owner. Two on-chain actions, nothing else: create tickets and
// mint tickets. The collection itself is immutable; these buttons each sign
// one transaction.

import { useState } from "react";
import { Plus, Ticket } from "lucide-react";
import { useWallet } from "@/hooks/use-wallet";
import { CreateTicketsDialog } from "./create-tickets-dialog";
import { MintTicketsDialog } from "./mint-tickets-dialog";

export function TicketOwnerActions({
  contractAddress,
  owner,
}: {
  contractAddress: string;
  owner?: string | null;
}) {
  const { address } = useWallet();
  const [createOpen, setCreateOpen] = useState(false);
  const [mintOpen, setMintOpen] = useState(false);

  const isOwner =
    !!address && !!owner && owner.toLowerCase() === address.toLowerCase();
  if (!isOwner) return null;

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => setCreateOpen(true)}
        className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-semibold text-white bg-teal-600 hover:brightness-110 active:scale-[0.98] transition"
      >
        <Plus className="h-3.5 w-3.5" />
        Create tickets
      </button>
      <button
        onClick={() => setMintOpen(true)}
        className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-semibold border border-border hover:bg-muted active:scale-[0.98] transition text-muted-foreground hover:text-foreground"
      >
        <Ticket className="h-3.5 w-3.5" />
        Mint tickets
      </button>

      <CreateTicketsDialog
        contractAddress={contractAddress}
        open={createOpen}
        onOpenChange={setCreateOpen}
      />
      <MintTicketsDialog
        contractAddress={contractAddress}
        open={mintOpen}
        onOpenChange={setMintOpen}
      />
    </div>
  );
}
