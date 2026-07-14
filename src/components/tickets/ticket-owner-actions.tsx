"use client";

// The ip-tickets service action on the collection page — one featured button,
// visible only to the collection owner, in the right owner cluster (the same
// slot erc1155 collections use for "Mint editions"). The mint dialog is the
// single entry point: pick one of your tickets to mint, or create a new one
// (which opens the create form, then returns here with it selected).

import { useState } from "react";
import { Ticket } from "lucide-react";
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
  const [mintOpen, setMintOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [preselectId, setPreselectId] = useState<string | null>(null);

  const isOwner =
    !!address && !!owner && owner.toLowerCase() === address.toLowerCase();
  if (!isOwner) return null;

  return (
    <>
      <div className="btn-border-animated p-[1px] rounded-xl">
        <button
          onClick={() => setMintOpen(true)}
          className="flex items-center gap-2 h-10 px-5 rounded-[11px] text-sm font-semibold text-white bg-transparent hover:brightness-110 active:scale-[0.98] transition"
        >
          <Ticket className="h-4 w-4" />
          Mint tickets
        </button>
      </div>

      <MintTicketsDialog
        contractAddress={contractAddress}
        open={mintOpen}
        onOpenChange={(v) => { setMintOpen(v); if (!v) setPreselectId(null); }}
        preselectTicketId={preselectId}
        onCreateNew={() => {
          setMintOpen(false);
          setCreateOpen(true);
        }}
      />
      <CreateTicketsDialog
        contractAddress={contractAddress}
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={() => {
          setCreateOpen(false);
          setMintOpen(true);
        }}
      />
    </>
  );
}
