"use client";

// Mint tickets — the ip-tickets service action on the collection page.
// One transaction: mint(recipient, ticket_id, quantity), owner-only on-chain.

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Ticket } from "lucide-react";
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
import { rewardToast } from "@/lib/reward-toast";
import { starknetProvider } from "@/lib/starknet";
import { useWallet } from "@/hooks/use-wallet";

const schema = z.object({
  ticketId: z
    .string()
    .min(1, "Ticket ID required")
    .regex(/^\d+$/, "Must be a positive integer"),
  recipient: z.string().min(1, "Recipient address required"),
  amount: z
    .string()
    .min(1, "Quantity required")
    .regex(/^\d+$/, "Must be a positive integer")
    .refine((v) => parseInt(v, 10) >= 1, "Minimum 1"),
});
type FormValues = z.infer<typeof schema>;

export function MintTicketsDialog({
  contractAddress,
  open,
  onOpenChange,
}: {
  contractAddress: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const contract = normalizeAddress("STARKNET", contractAddress);
  const { address } = useWallet();
  const action = useWriteAction();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { ticketId: "1", recipient: address ?? "", amount: "1" },
  });

  const handleMintMore = () => {
    action.reset();
    form.reset({ ticketId: form.getValues("ticketId"), recipient: "", amount: "1" });
  };

  const handleDone = () => {
    action.reset();
    onOpenChange(false);
  };

  const onSubmit = (values: FormValues) => {
    void action.run((secret) => handleUnlocked(values, secret));
  };

  const handleUnlocked = async (values: FormValues, secret: string) => {
    const recipientNorm = normalizeAddress("STARKNET", values.recipient);
    const col = new Contract(IPTicketCollectionABI as unknown as Abi, contract, starknetProvider);
    const call = col.populate("mint", [
      recipientNorm,
      cairo.uint256(values.ticketId),
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
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Ticket className="h-4 w-4 text-teal-500" />
              Mint tickets
            </DialogTitle>
            <DialogDescription>
              Send tickets directly to a wallet. Recipients hold their tickets — you cannot revoke them.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="ticketId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ticket ID</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" placeholder="1" {...field} />
                    </FormControl>
                    <FormDescription>Tickets are numbered in the order you created them, starting at 1.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                disabled={action.status !== "idle"}
                className="w-full bg-teal-600 hover:bg-teal-700 text-white"
              >
                <Ticket className="h-4 w-4 mr-2" />
                Mint tickets
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}
