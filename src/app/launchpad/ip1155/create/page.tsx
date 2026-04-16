"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Link from "next/link";
import { Layers, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { PinDialog } from "@/components/chipi/pin-dialog";
import { WalletSetupDialog } from "@/components/chipi/wallet-setup-dialog";
import { useChipiTransaction } from "@/hooks/use-chipi-transaction";
import { useSessionKey } from "@/hooks/use-session-key";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import { FadeIn } from "@/components/ui/motion-primitives";
import { IPCollection1155FactoryABI, ERC1155_FACTORY_CONTRACT_MAINNET, normalizeAddress } from "@medialane/sdk";
import { Contract, hash } from "starknet";
import { starknetProvider } from "@/lib/starknet";

const COLLECTION_DEPLOYED_SELECTOR = hash.getSelectorFromName("CollectionDeployed");

const FACTORY = ERC1155_FACTORY_CONTRACT_MAINNET as `0x${string}`;

const schema = z.object({
  name: z.string().min(1, "Collection name required").max(100),
  symbol: z
    .string()
    .min(1, "Symbol required")
    .max(10)
    .regex(/^[A-Z0-9]+$/, "Uppercase letters and numbers only"),
});

type FormValues = z.infer<typeof schema>;

export default function CreateIP1155CollectionPage() {
  const { isSignedIn } = useUser();
  const { walletAddress, hasWallet } = useSessionKey();
  const { executeTransaction, isSubmitting } = useChipiTransaction();

  const [pinOpen, setPinOpen] = useState(false);
  const [walletSetupOpen, setWalletSetupOpen] = useState(false);
  const [pendingValues, setPendingValues] = useState<FormValues | null>(null);
  const [done, setDone] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [deployedAddress, setDeployedAddress] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", symbol: "" },
  });

  const onSubmit = (values: FormValues) => {
    if (!hasWallet) { setWalletSetupOpen(true); return; }
    setPendingValues(values);
    setPinOpen(true);
  };

  const handlePin = async (pin: string) => {
    setPinOpen(false);
    if (!pendingValues || !walletAddress) return;

    try {
      const factory = new Contract(
        IPCollection1155FactoryABI as any,
        FACTORY,
        starknetProvider
      );
      const call = factory.populate("deploy_collection", [
        pendingValues.name,
        pendingValues.symbol,
      ]);

      const result = await executeTransaction({
        pin,
        contractAddress: FACTORY,
        calls: [{
          contractAddress: FACTORY,
          entrypoint: "deploy_collection",
          calldata: call.calldata as string[],
        }],
      });

      if (result.status === "confirmed") {
        setTxHash(result.txHash);

        // Extract deployed collection address from the CollectionDeployed event
        try {
          const receipt = await starknetProvider.getTransactionReceipt(result.txHash);
          const events = (receipt as any)?.events ?? [];
          const deployEvent = events.find((e: any) =>
            e.keys?.[0] && BigInt(e.keys[0]) === BigInt(COLLECTION_DEPLOYED_SELECTOR)
          );
          if (deployEvent?.keys?.[1]) {
            setDeployedAddress(normalizeAddress(deployEvent.keys[1]));
          }
        } catch { /* non-fatal — user can still navigate manually */ }

        setDone(true);
      } else {
        toast.error(result.revertReason ?? "Transaction reverted");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to deploy collection");
    }
  };

  // ── Success ──────────────────────────────────────────────────────────────────
  if (done) {
    return (
      <div className="container max-w-lg mx-auto px-4 pt-24 pb-8 text-center space-y-6">
        <div className="flex justify-center">
          <div className="h-20 w-20 rounded-full bg-violet-500/10 flex items-center justify-center">
            <CheckCircle2 className="h-10 w-10 text-violet-500" />
          </div>
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Collection deployed</h1>
          <p className="text-muted-foreground">
            Your ERC-1155 IP collection is live on Starknet. You can mint tokens into it now.
          </p>
          {deployedAddress && (
            <p className="text-xs text-muted-foreground font-mono break-all">
              {deployedAddress}
            </p>
          )}
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {deployedAddress ? (
            <Button asChild className="bg-violet-600 hover:bg-violet-700 text-white">
              <Link href={`/launchpad/ip1155/${deployedAddress}/mint`}>Mint tokens</Link>
            </Button>
          ) : (
            <Button asChild variant="outline">
              <Link href="/portfolio">View portfolio</Link>
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => {
              setDone(false);
              setTxHash(null);
              setDeployedAddress(null);
              form.reset();
            }}
          >
            Deploy another
          </Button>
        </div>
      </div>
    );
  }

  // ── Not signed in ─────────────────────────────────────────────────────────
  if (!isSignedIn) {
    return (
      <div className="container max-w-lg mx-auto px-4 pt-24 pb-8 text-center space-y-4">
        <Layers className="h-10 w-10 text-violet-500 mx-auto" />
        <h1 className="text-2xl font-bold">Sign in to create a collection</h1>
        <p className="text-muted-foreground">
          Deploy a multi-edition ERC-1155 IP collection on Starknet.
        </p>
      </div>
    );
  }

  // ── Create form ────────────────────────────────────────────────────────────
  return (
    <>
      <div className="container max-w-xl mx-auto px-4 pt-10 pb-16 space-y-8">
        <FadeIn>
          <div className="space-y-1">
            <span className="pill-badge inline-flex gap-1.5">
              <Layers className="h-3 w-3" />
              IP Collection · ERC-1155
            </span>
            <h1 className="text-3xl font-bold mt-3">Create IP Collection</h1>
            <p className="text-muted-foreground text-sm">
              Deploy a multi-edition ERC-1155 collection. You become the owner and can
              mint any number of token types with immutable provenance records.
            </p>
          </div>
        </FadeIn>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">

            <FadeIn delay={0.08}>
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Collection name *</FormLabel>
                  <FormControl>
                    <Input placeholder="My IP Collection" {...field} />
                  </FormControl>
                  <FormDescription>Stored on-chain in the contract.</FormDescription>
                  <FormMessage />
                </FormItem>
              )} />
            </FadeIn>

            <FadeIn delay={0.12}>
              <FormField control={form.control} name="symbol" render={({ field }) => (
                <FormItem>
                  <FormLabel>Symbol *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="MIP"
                      {...field}
                      onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                      className="max-w-[160px]"
                    />
                  </FormControl>
                  <FormDescription>Short ticker shown in wallets (e.g. MIP).</FormDescription>
                  <FormMessage />
                </FormItem>
              )} />
            </FadeIn>

            <FadeIn delay={0.16}>
              <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-1.5 text-sm">
                <p className="font-medium">What happens next</p>
                <ul className="text-muted-foreground space-y-1 list-disc list-inside text-xs">
                  <li>A new ERC-1155 contract is deployed on Starknet mainnet</li>
                  <li>You become the sole owner — only you can mint new token types</li>
                  <li>Each token&apos;s URI and authorship are immutable once minted</li>
                  <li>List your tokens on the Medialane1155 marketplace after minting</li>
                </ul>
              </div>
            </FadeIn>

            <FadeIn delay={0.2}>
              <div className="btn-border-animated p-[1px] rounded-xl mt-2">
                <Button
                  type="submit"
                  size="lg"
                  className="w-full rounded-xl bg-background text-foreground hover:bg-muted/60"
                  disabled={isSubmitting}
                >
                  {isSubmitting
                    ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Deploying…</>
                    : <><Layers className="h-4 w-4 mr-2" />Deploy Collection</>}
                </Button>
              </div>
              <p className="text-xs text-center text-muted-foreground mt-2">
                Gas is free. Your PIN signs the transaction.
              </p>
            </FadeIn>

          </form>
        </Form>
      </div>

      <PinDialog
        open={pinOpen}
        onSubmit={handlePin}
        onCancel={() => setPinOpen(false)}
        title="Deploy ERC-1155 collection"
        description="Enter your PIN to deploy your IP collection contract on Starknet."
      />
      <WalletSetupDialog
        open={walletSetupOpen}
        onOpenChange={setWalletSetupOpen}
        onSuccess={() => { setWalletSetupOpen(false); setPinOpen(true); }}
      />
    </>
  );
}
