"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { WalletSetupDialog } from "@/components/chipi/wallet-setup-dialog";
import { PinDialog } from "@/components/chipi/pin-dialog";
import { TxStatus } from "@/components/chipi/tx-status";
import { useChipiTransaction } from "@/hooks/use-chipi-transaction";
import { useSessionKey } from "@/hooks/use-session-key";
import { useMedialaneClient } from "@/hooks/use-medialane-client";
import { EXPLORER_URL } from "@/lib/constants";
import { Layers, Loader2, CheckCircle2, AlertCircle, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import type { ChipiCall } from "@/hooks/use-chipi-transaction";

const schema = z.object({
  name: z.string().min(1, "Name required").max(100),
  symbol: z
    .string()
    .min(1, "Symbol required")
    .max(10, "Max 10 characters")
    .regex(/^[A-Z0-9]+$/, "Uppercase letters and numbers only"),
  description: z.string().max(500).optional(),
});

type FormValues = z.infer<typeof schema>;

export default function CreateCollectionPage() {
  const { executeTransaction, status, txHash, error, statusMessage } = useChipiTransaction();
  const { walletAddress, wallet } = useSessionKey();
  const client = useMedialaneClient();

  const [walletSetupOpen, setWalletSetupOpen] = useState(false);
  const [pinOpen, setPinOpen] = useState(false);
  const [pendingValues, setPendingValues] = useState<FormValues | null>(null);

  const hasWallet = !!walletAddress;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", symbol: "", description: "" },
  });

  const onSubmit = (values: FormValues) => {
    setPendingValues(values);
    if (!hasWallet) {
      setWalletSetupOpen(true);
      return;
    }
    setPinOpen(true);
  };

  const handlePin = async (pin: string) => {
    setPinOpen(false);
    if (!pendingValues || !walletAddress) return;

    try {
      // 1. Create collection intent — pre-signed, returns calls immediately
      const intentRes = await client.api.createCollectionIntent({
        owner: walletAddress,
        name: pendingValues.name,
        symbol: pendingValues.symbol,
        baseUri: "",
      });

      const calls = intentRes.data.calls as ChipiCall[];
      if (!calls || calls.length === 0) throw new Error("No calls returned from intent");

      // 2. Execute the pre-signed calls via ChipiPay (gasless)
      const walletOverride = wallet
        ? { publicKey: wallet.publicKey, encryptedPrivateKey: wallet.encryptedPrivateKey }
        : undefined;

      await executeTransaction({
        pin,
        contractAddress: calls[0].contractAddress,
        calls,
        wallet: walletOverride,
      });

      toast.success("Collection created!", {
        description: `${pendingValues.name} (${pendingValues.symbol}) is live on Starknet.`,
      });
      form.reset();
    } catch (err: any) {
      toast.error("Collection creation failed", { description: err?.message });
    }
  };

  if (status === "confirmed") {
    return (
      <div className="container max-w-lg mx-auto px-4 py-16 text-center space-y-6">
        <div className="h-16 w-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto">
          <CheckCircle2 className="h-8 w-8 text-emerald-500" />
        </div>
        <h1 className="text-2xl font-bold">Collection created!</h1>
        <p className="text-muted-foreground">
          Your collection is now live on Starknet. You can start minting assets into it.
        </p>
        {txHash && (
          <Button variant="outline" size="sm" asChild>
            <a
              href={`${EXPLORER_URL}/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2"
            >
              View on Voyager <ExternalLink className="h-3 w-3" />
            </a>
          </Button>
        )}
        <div className="flex gap-3 justify-center pt-2">
          <Button onClick={() => { form.reset(); window.location.reload(); }}>
            Create another
          </Button>
          <Button variant="outline" asChild>
            <Link href="/portfolio">My portfolio</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="container max-w-2xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Layers className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Create Collection</h1>
            <p className="text-muted-foreground mt-0.5">
              Deploy a new NFT collection on Starknet. Gas is free.
            </p>
          </div>
        </div>

        {(status === "submitting" || status === "confirming") && (
          <TxStatus status={status} txHash={txHash} statusMessage={statusMessage} />
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Collection name *</FormLabel>
                  <FormControl>
                    <Input placeholder="My Creative Works" {...field} />
                  </FormControl>
                  <FormDescription>The display name for your collection.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="symbol"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Symbol *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="MCW"
                      {...field}
                      onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                    />
                  </FormControl>
                  <FormDescription>
                    Short ticker (2–10 uppercase letters). Shown in wallets and explorers.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe your collection and what kind of work it contains…"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full h-12 text-base"
              disabled={status === "submitting" || status === "confirming"}
            >
              {status === "submitting" || status === "confirming" ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating…
                </>
              ) : (
                <>
                  <Layers className="h-4 w-4 mr-2" />
                  Create collection
                </>
              )}
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              Gas is free. Your PIN signs the transaction.
            </p>
          </form>
        </Form>
      </div>

      <PinDialog
        open={pinOpen}
        onSubmit={handlePin}
        onCancel={() => setPinOpen(false)}
        title="Confirm collection creation"
        description="Enter your PIN to deploy your collection on Starknet."
      />

      <WalletSetupDialog
        open={walletSetupOpen}
        onOpenChange={setWalletSetupOpen}
        onSuccess={() => {
          setWalletSetupOpen(false);
          setPinOpen(true);
        }}
      />
    </>
  );
}
