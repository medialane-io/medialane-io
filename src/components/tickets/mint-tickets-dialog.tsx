"use client";

// Mint tickets — the single owner entry point on the collection page.
// Pick one of the collection's tickets (read straight from the chain, so
// never-minted tickets appear too), or start a new one via onCreateNew.
// One transaction: mint(recipient, ticket_id, quantity), owner-only on-chain.

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, Ticket, Loader2 } from "lucide-react";
import { Contract, cairo, type Abi } from "starknet";
import { normalizeAddress, IPTicketCollectionABI } from "@medialane/sdk";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { useWriteAction } from "@/hooks/use-write-action";
import { TransactionDialog } from "@/components/transaction/transaction-dialog";
import { WalletSetupGate } from "@/components/transaction/wallet-setup-gate";
import { useTicketList, type TicketListItem } from "@/hooks/use-tickets";
import { rewardToast } from "@/lib/reward-toast";
import { starknetProvider } from "@/lib/starknet";
import { cn } from "@/lib/utils";
import { useWallet } from "@/hooks/use-wallet";

const schema = z.object({
  recipient: z.string().min(1, "Recipient address required"),
  amount: z
    .string()
    .min(1, "Quantity required")
    .regex(/^\d+$/, "Must be a positive integer")
    .refine((v) => parseInt(v, 10) >= 1, "Minimum 1"),
});
type FormValues = z.infer<typeof schema>;

function TicketRow({
  ticket,
  selected,
  onSelect,
}: {
  ticket: TicketListItem;
  selected: boolean;
  onSelect: () => void;
}) {
  const remaining = ticket.maxSupply - ticket.minted;
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "w-full flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left transition",
        selected
          ? "border-teal-500 bg-teal-500/5"
          : "border-border hover:bg-muted/40"
      )}
    >
      <div className="flex items-center gap-3 min-w-0">
        <Ticket className={cn("h-4 w-4 shrink-0", selected ? "text-teal-500" : "text-muted-foreground")} />
        <div className="min-w-0">
          <p className="text-sm font-semibold">Ticket #{ticket.id}</p>
          <p className="text-xs text-muted-foreground tabular-nums">
            {ticket.minted.toString()} of {ticket.maxSupply.toString()} minted
          </p>
        </div>
      </div>
      <span className={cn("text-xs tabular-nums shrink-0", remaining === 0n ? "text-destructive" : "text-muted-foreground")}>
        {remaining === 0n ? "Sold out" : `${remaining.toString()} left`}
      </span>
    </button>
  );
}

export function MintTicketsDialog({
  contractAddress,
  open,
  onOpenChange,
  preselectTicketId,
  onCreateNew,
}: {
  contractAddress: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Preselect a ticket (e.g. one just created). */
  preselectTicketId?: string | null;
  /** Open the create-tickets flow instead. */
  onCreateNew: () => void;
}) {
  const contract = normalizeAddress("STARKNET", contractAddress);
  const { address } = useWallet();
  const action = useWriteAction();
  const { tickets, isLoading: listLoading, mutate: mutateList } = useTicketList(open ? contract : null);

  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (preselectTicketId) setSelectedId(preselectTicketId);
  }, [preselectTicketId]);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { recipient: address ?? "", amount: "1" },
  });

  const handleMintMore = () => {
    action.reset();
    form.reset({ recipient: "", amount: "1" });
    void mutateList();
  };

  const handleDone = () => {
    action.reset();
    void mutateList();
    onOpenChange(false);
  };

  const onSubmit = (values: FormValues) => {
    if (!selectedId) return;
    const ticketId = selectedId;
    void action.run((secret) => handleUnlocked(ticketId, values, secret));
  };

  const handleUnlocked = async (ticketId: string, values: FormValues, secret: string) => {
    const recipientNorm = normalizeAddress("STARKNET", values.recipient);
    const col = new Contract(IPTicketCollectionABI as unknown as Abi, contract, starknetProvider);
    const call = col.populate("mint", [
      recipientNorm,
      cairo.uint256(ticketId),
      cairo.uint256(values.amount),
    ]);

    const result = await action.executeTransaction({
      pin: secret,
      calls: [{ contractAddress: contract, entrypoint: "mint", calldata: call.calldata as string[] }],
    });
    if (result.status !== "confirmed") {
      throw new Error(result.revertReason ?? "Transaction reverted");
    }
    rewardToast("launch_launchpad");
    return result;
  };

  return (
    <>
      <TransactionDialog
        action={action}
        title="Mint tickets"
        processingLabel="Minting tickets…"
        firstStepLabel="Prepare transaction"
        successTitle="Tickets minted!"
        pinDescription="Enter your PIN to mint these tickets."
      >
        <p className="text-sm text-muted-foreground text-center">
          {form.getValues("amount")} ticket(s) sent to the recipient&apos;s wallet.
        </p>
        <div className="flex flex-col sm:flex-row gap-2 w-full pt-1">
          <Button variant="outline" className="flex-1" onClick={handleMintMore}>
            Mint more
          </Button>
          <Button className="flex-1 bg-teal-600 hover:bg-teal-700 text-white" onClick={handleDone}>
            Done
          </Button>
        </div>
      </TransactionDialog>
      <WalletSetupGate action={action} />

      <Dialog open={open && action.status === "idle"} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Ticket className="h-4 w-4 text-teal-500" />
              Mint tickets
            </DialogTitle>
            <DialogDescription>
              Send tickets directly to a wallet. Recipients hold their tickets — you cannot revoke them.
            </DialogDescription>
          </DialogHeader>

          {/* Ticket picker — from chain, includes never-minted tickets */}
          <div className="space-y-2">
            {listLoading ? (
              <div className="flex items-center justify-center gap-2 py-6 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Loading your tickets…</span>
              </div>
            ) : tickets.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border p-6 text-center space-y-3">
                <p className="text-sm font-semibold">No tickets yet</p>
                <p className="text-xs text-muted-foreground">
                  Create your first ticket — set its supply, image, and validity window.
                </p>
                <Button size="sm" onClick={onCreateNew} className="bg-teal-600 hover:bg-teal-700 text-white gap-1.5">
                  <Plus className="h-3.5 w-3.5" />
                  New ticket
                </Button>
              </div>
            ) : (
              <>
                {tickets.map((t) => (
                  <TicketRow
                    key={t.id}
                    ticket={t}
                    selected={selectedId === t.id}
                    onSelect={() => setSelectedId(t.id)}
                  />
                ))}
                <button
                  type="button"
                  onClick={onCreateNew}
                  className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-border px-4 py-2.5 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/40 transition"
                >
                  <Plus className="h-3.5 w-3.5" />
                  New ticket
                </button>
              </>
            )}
          </div>

          {tickets.length > 0 && (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <FormField
                  control={form.control}
                  name="recipient"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Recipient address</FormLabel>
                      <FormControl>
                        <Input placeholder="0x…" {...field} />
                      </FormControl>
                      <FormDescription>The wallet that will receive the tickets.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantity</FormLabel>
                      <FormControl>
                        <Input type="number" min="1" placeholder="1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  disabled={action.status !== "idle" || !selectedId}
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white"
                >
                  <Ticket className="h-4 w-4 mr-2" />
                  {selectedId ? `Mint ticket #${selectedId}` : "Pick a ticket"}
                </Button>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
