"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Link from "next/link";
import { Contract, type Abi } from "starknet";
import { starknetProvider } from "@/lib/starknet";
import { Ticket, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { PinDialog } from "@/components/chipi/pin-dialog";
import { useWriteAction } from "@/hooks/use-write-action";
import { WalletSetupGate } from "@/components/transaction/wallet-setup-gate";
import { useSessionKey } from "@/hooks/use-session-key";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import { STARKNET_IP_TICKETS_FACTORY_CONTRACT } from "@/lib/constants";
import { IPTicketCollectionFactoryABI, IPTicketCollectionABI, getTokenBySymbol } from "@medialane/sdk";
import { useMyTicketCollections } from "@/hooks/use-tickets";
import { LaunchpadSuccessState, LaunchpadErrorState, LaunchpadProcessingState } from "@/components/launchpad/launchpad-success-state";
import { ClaimRouteShell } from "@/components/claim/claim-route-shell";
import { MedialaneCollectionCard } from "@medialane/ui";
import { resolveTokenImage } from "@/lib/utils";
import { CreateTicketAside } from "@/components/claim/create-ticket-aside";
import { rewardToast } from "@/lib/reward-toast";
import { LaunchpadSignedOutState } from "@/components/launchpad/launchpad-signed-out-state";

const deploySchema = z.object({
  name: z.string().min(1, "Name required").max(100),
  symbol: z.string().min(1, "Symbol required").max(10).regex(/^[A-Z0-9]+$/, "Uppercase letters and numbers only"),
});
type DeployValues = z.infer<typeof deploySchema>;

const collectionSchema = z.object({
  metadataUri: z.string().min(1, "Metadata URI required").regex(/^(ipfs|ar):\/\//, "Must start with ipfs:// or ar://"),
  maxSupply: z.string().regex(/^\d+$/, "Must be a positive integer").refine((v) => parseInt(v, 10) >= 1, "Minimum 1"),
  priceAmount: z.string().default("").refine((v) => v === "" || !Number.isNaN(Number(v)), "Enter a valid price"),
  paymentToken: z.string().default("USDC"),
  expirationDate: z.string().min(1, "Expiration date required"),
  royalty: z.coerce.number().min(0).max(50).default(0),
});
type CollectionValues = z.infer<typeof collectionSchema>;

export default function CreateTicketsPage() {
  const { isSignedIn } = useUser();
  const { walletAddress } = useSessionKey();
  const deployAction = useWriteAction();
  const createAction = useWriteAction();
  const deployBusy = deployAction.status === "processing" || deployAction.status === "confirming";
  const createBusy = createAction.status === "processing" || createAction.status === "confirming";

  const [justDeployed, setJustDeployed] = useState(false);
  const { collections: myCollections, mutate } = useMyTicketCollections(walletAddress ?? null);
  const existingCollection = myCollections[0]?.contractAddress ?? null;

  const deployForm = useForm<DeployValues>({
    resolver: zodResolver(deploySchema),
    defaultValues: { name: "", symbol: "" },
  });
  const collectionForm = useForm<CollectionValues>({
    resolver: zodResolver(collectionSchema),
    defaultValues: { metadataUri: "", maxSupply: "100", priceAmount: "", paymentToken: "USDC", expirationDate: "", royalty: 0 },
  });

  const onDeploy = (values: DeployValues) => {
    if (!STARKNET_IP_TICKETS_FACTORY_CONTRACT) {
      toast.error("IP Tickets factory not configured");
      return;
    }
    void deployAction.run(async (secret) => {
      const factory = new Contract(IPTicketCollectionFactoryABI as unknown as Abi, STARKNET_IP_TICKETS_FACTORY_CONTRACT, starknetProvider);
      const call = factory.populate("deploy_ticket_collection", [values.name, values.symbol]);
      const result = await deployAction.executeTransaction({
        pin: secret,
        calls: [{ contractAddress: STARKNET_IP_TICKETS_FACTORY_CONTRACT, entrypoint: "deploy_ticket_collection", calldata: call.calldata as string[] }],
      });
      if (result.status === "confirmed") {
        setJustDeployed(true);
        rewardToast("create_ticket_collection");
        mutate();
      }
      return result;
    });
  };

  const onCreateCollection = (values: CollectionValues) => {
    if (!existingCollection) {
      toast.error("Deploy your ticket contract first");
      return;
    }
    void createAction.run(async (secret) => {
      const price = values.priceAmount ? Number(values.priceAmount) : 0;
      const token = price > 0 ? getTokenBySymbol(values.paymentToken) : null;
      if (price > 0 && !token) throw new Error("Unsupported payment token");

      const priceBigInt = price > 0 ? BigInt(Math.round(price * 10 ** token!.decimals)) : 0n;
      const expiration = Math.floor(new Date(values.expirationDate).getTime() / 1000);
      const royaltyBps = Math.round(values.royalty * 100);

      const collection = new Contract(IPTicketCollectionABI as unknown as Abi, existingCollection, starknetProvider);
      const call = collection.populate("create_ticket_collection", [
        priceBigInt,
        BigInt(values.maxSupply),
        expiration,
        royaltyBps,
        price > 0 ? { Some: token!.address } : { None: undefined },
        values.metadataUri,
      ]);

      return createAction.executeTransaction({
        pin: secret,
        calls: [{ contractAddress: existingCollection, entrypoint: "create_ticket_collection", calldata: call.calldata as string[] }],
      });
    });
  };

  if (createAction.status === "error") {
    return <LaunchpadErrorState description={createAction.error ?? "Failed to create ticket collection"} backHref="/launchpad/tickets" backLabel="Back to Tickets launchpad" onRetry={createAction.reset} />;
  }
  if (deployAction.status === "error") {
    return <LaunchpadErrorState description={deployAction.error ?? "Failed to deploy ticket contract"} backHref="/launchpad/tickets" backLabel="Back to Tickets launchpad" onRetry={deployAction.reset} />;
  }
  if (deployBusy) return <LaunchpadProcessingState title="Deploying your ticket contract…" />;
  if (createBusy) return <LaunchpadProcessingState title="Creating your event…" />;

  if (createAction.status === "success") {
    return (
      <LaunchpadSuccessState
        icon={CheckCircle2}
        accentClassName="bg-teal-500/10"
        iconClassName="text-teal-500"
        actionClassName="bg-teal-600 hover:bg-teal-700 text-white"
        title="Event created"
        description="Your ticket event is live onchain. It will appear in the launchpad within a minute once indexed."
        backHref="/launchpad/tickets"
        backLabel="Back to Tickets launchpad"
        actionLabel="Create another event"
        onAction={() => { createAction.reset(); collectionForm.reset(); }}
      />
    );
  }

  if (!isSignedIn) {
    return (
      <LaunchpadSignedOutState
        icon={Ticket}
        iconClassName="text-teal-500"
        title="Sign in to sell tickets"
        description="Sign in to deploy your ticket contract onchain."
      />
    );
  }

  return (
    <>
      <ClaimRouteShell
        icon={<Ticket className="h-4 w-4 text-white" />}
        title="Sell Tickets"
        subtitle="Deploy your own ticket contract once, then create as many events as you like under it."
        aside={
          <>
            <MedialaneCollectionCard
              image={resolveTokenImage(myCollections[0]?.image)}
              name={myCollections[0]?.name || deployForm.watch("name")}
              collection={deployForm.watch("symbol") || "Tickets"}
              creator={walletAddress ? `${walletAddress.slice(0, 6)}…${walletAddress.slice(-4)}` : undefined}
            />
            <CreateTicketAside />
          </>
        }
      >
        {!existingCollection ? (
          <Form {...deployForm}>
            <form onSubmit={deployForm.handleSubmit(onDeploy)} className="space-y-5">
              <p className="text-sm font-medium">Step 1 — Deploy your ticket contract (once, free)</p>
              {justDeployed && (
                <p className="text-xs text-teal-500">
                  ✓ Deployed — waiting for it to appear (usually under a minute). This page will move to step 2 automatically.
                </p>
              )}
              <FormField control={deployForm.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Contract name *</FormLabel>
                  <FormControl><Input placeholder="My Events" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={deployForm.control} name="symbol" render={({ field }) => (
                <FormItem>
                  <FormLabel>Symbol *</FormLabel>
                  <FormControl>
                    <Input placeholder="MYEVT" {...field} onChange={(e) => field.onChange(e.target.value.toUpperCase())} className="max-w-[160px]" />
                  </FormControl>
                  <FormDescription>Short ticker shown in wallets.</FormDescription>
                  <FormMessage />
                </FormItem>
              )} />
              <Button type="submit" size="lg" className="w-full rounded-xl bg-teal-600 hover:bg-teal-700 text-white" disabled={deployBusy}>
                {deployBusy ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Deploying…</> : <><Ticket className="h-4 w-4 mr-2" />Deploy Ticket Contract</>}
              </Button>
            </form>
          </Form>
        ) : (
          <Form {...collectionForm}>
            <form onSubmit={collectionForm.handleSubmit(onCreateCollection)} className="space-y-5">
              <p className="text-sm font-medium">Step 2 — Create your event</p>
              <FormField control={collectionForm.control} name="metadataUri" render={({ field }) => (
                <FormItem>
                  <FormLabel>Metadata URI *</FormLabel>
                  <FormControl><Input placeholder="ipfs://bafybei…" {...field} /></FormControl>
                  <FormDescription>ipfs:// or ar:// only — enforced on-chain.</FormDescription>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={collectionForm.control} name="maxSupply" render={({ field }) => (
                <FormItem>
                  <FormLabel>Max supply *</FormLabel>
                  <FormControl><Input type="number" min={1} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="flex gap-3">
                <FormField control={collectionForm.control} name="priceAmount" render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Price (0 = free)</FormLabel>
                    <FormControl><Input type="number" min={0} step="0.01" placeholder="0" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={collectionForm.control} name="paymentToken" render={({ field }) => (
                  <FormItem className="w-28">
                    <FormLabel>Token</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                  </FormItem>
                )} />
              </div>
              <FormField control={collectionForm.control} name="expirationDate" render={({ field }) => (
                <FormItem>
                  <FormLabel>Expires *</FormLabel>
                  <FormControl><Input type="date" {...field} /></FormControl>
                  <FormDescription>Tickets lose access after this date — they stay transferable.</FormDescription>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={collectionForm.control} name="royalty" render={({ field }) => (
                <FormItem>
                  <FormLabel>Royalty %</FormLabel>
                  <FormControl><Input type="number" min={0} max={50} step="0.5" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <Button type="submit" size="lg" className="w-full rounded-xl bg-teal-600 hover:bg-teal-700 text-white" disabled={createBusy}>
                {createBusy ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Creating…</> : <><Ticket className="h-4 w-4 mr-2" />Create Event</>}
              </Button>
            </form>
          </Form>
        )}
      </ClaimRouteShell>

      <PinDialog {...deployAction.pinDialogProps} title="Deploy ticket contract" description="Enter your PIN to deploy your ticket contract onchain." />
      <PinDialog {...createAction.pinDialogProps} title="Create event" description="Enter your PIN to create this event onchain." />
      <WalletSetupGate action={deployAction} />
      <WalletSetupGate action={createAction} />
    </>
  );
}
