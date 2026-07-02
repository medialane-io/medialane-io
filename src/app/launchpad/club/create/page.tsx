"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Contract, type Abi } from "starknet";
import { starknetProvider } from "@/lib/starknet";
import { Users, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { PinDialog } from "@/components/chipi/pin-dialog";
import { useWriteAction } from "@/hooks/use-write-action";
import { WalletSetupGate } from "@/components/transaction/wallet-setup-gate";
import { useUser } from "@clerk/nextjs";
import { STARKNET_IP_CLUB_REGISTRY_CONTRACT } from "@/lib/constants";
import { IPClubABI, getTokenBySymbol } from "@medialane/sdk";
import { LaunchpadSuccessState, LaunchpadErrorState, LaunchpadProcessingState } from "@/components/launchpad/launchpad-success-state";
import { ClaimRouteShell } from "@/components/claim/claim-route-shell";
import { CreateClubAside } from "@/components/claim/create-club-aside";
import { LaunchpadSignedOutState } from "@/components/launchpad/launchpad-signed-out-state";
import { toast } from "sonner";

const schema = z.object({
  name: z.string().min(1, "Name required").max(100),
  symbol: z.string().min(1, "Symbol required").max(10).regex(/^[A-Z0-9]+$/, "Uppercase letters and numbers only"),
  metadataUri: z.string().min(1, "Metadata URI required").regex(/^(ipfs|ar):\/\//, "Must start with ipfs:// or ar://"),
  maxMembers: z.string().default("").refine((v) => v === "" || /^\d+$/.test(v), "Must be a positive integer"),
  entryFeeAmount: z.string().default("").refine((v) => v === "" || !Number.isNaN(Number(v)), "Enter a valid amount"),
  paymentToken: z.string().default("USDC"),
});
type FormValues = z.infer<typeof schema>;

export default function CreateClubPage() {
  const { isSignedIn } = useUser();
  const action = useWriteAction();
  const busy = action.status === "processing" || action.status === "confirming";

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", symbol: "", metadataUri: "", maxMembers: "", entryFeeAmount: "", paymentToken: "USDC" },
  });

  const onSubmit = (values: FormValues) => {
    if (!STARKNET_IP_CLUB_REGISTRY_CONTRACT) {
      toast.error("IP Club registry not configured");
      return;
    }
    void action.run(async (secret) => {
      const fee = values.entryFeeAmount ? Number(values.entryFeeAmount) : 0;
      const token = fee > 0 ? getTokenBySymbol(values.paymentToken) : null;
      if (fee > 0 && !token) throw new Error("Unsupported payment token");

      const maxMembers = values.maxMembers ? Number(values.maxMembers) : null;
      const feeBigInt = fee > 0 ? BigInt(Math.round(fee * 10 ** token!.decimals)) : null;

      const registry = new Contract(IPClubABI as unknown as Abi, STARKNET_IP_CLUB_REGISTRY_CONTRACT, starknetProvider);
      const call = registry.populate("create_club", [
        values.name,
        values.symbol,
        values.metadataUri,
        maxMembers != null ? { Some: maxMembers } : { None: undefined },
        feeBigInt != null ? { Some: feeBigInt } : { None: undefined },
        feeBigInt != null ? { Some: token!.address } : { None: undefined },
      ]);

      return action.executeTransaction({
        pin: secret,
        calls: [{ contractAddress: STARKNET_IP_CLUB_REGISTRY_CONTRACT, entrypoint: "create_club", calldata: call.calldata as string[] }],
      });
    });
  };

  if (action.status === "error") {
    return <LaunchpadErrorState description={action.error ?? "Failed to create club"} backHref="/launchpad/club" backLabel="Back to Club launchpad" onRetry={action.reset} />;
  }
  if (busy) return <LaunchpadProcessingState title="Creating your club…" />;

  if (action.status === "success") {
    return (
      <LaunchpadSuccessState
        icon={CheckCircle2}
        accentClassName="bg-indigo-500/10"
        iconClassName="text-indigo-500"
        actionClassName="bg-indigo-600 hover:bg-indigo-700 text-white"
        title="Club created"
        description="Your club and its membership card are live onchain. It will appear in the launchpad within a minute once indexed."
        backHref="/launchpad/club"
        backLabel="Back to Club launchpad"
        actionLabel="Create another"
        onAction={() => { action.reset(); form.reset(); }}
      />
    );
  }

  if (!isSignedIn) {
    return (
      <LaunchpadSignedOutState
        icon={Users}
        iconClassName="text-indigo-500"
        title="Sign in to create a club"
        description="Sign in to deploy your club onchain."
      />
    );
  }

  return (
    <>
      <ClaimRouteShell
        gated={false}
        icon={<Users className="h-4 w-4 text-white" />}
        title="Create a Club"
        subtitle="Give your closest fans a membership card that unlocks more — free to publish."
        aside={<CreateClubAside />}
      >
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel>Club name *</FormLabel>
                <FormControl><Input placeholder="Inner Circle" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="symbol" render={({ field }) => (
              <FormItem>
                <FormLabel>Symbol *</FormLabel>
                <FormControl>
                  <Input placeholder="CIRCLE" {...field} onChange={(e) => field.onChange(e.target.value.toUpperCase())} className="max-w-[160px]" />
                </FormControl>
                <FormDescription>Short ticker shown in wallets.</FormDescription>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="metadataUri" render={({ field }) => (
              <FormItem>
                <FormLabel>Metadata URI *</FormLabel>
                <FormControl><Input placeholder="ipfs://bafybei…" {...field} /></FormControl>
                <FormDescription>ipfs:// or ar:// only — enforced on-chain.</FormDescription>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="maxMembers" render={({ field }) => (
              <FormItem>
                <FormLabel>Member cap <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
                <FormControl><Input type="number" min={1} placeholder="Unlimited" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <div className="flex gap-3">
              <FormField control={form.control} name="entryFeeAmount" render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel>Entry fee <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
                  <FormControl><Input type="number" min={0} step="0.01" placeholder="Free" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="paymentToken" render={({ field }) => (
                <FormItem className="w-28">
                  <FormLabel>Token</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                </FormItem>
              )} />
            </div>
            <Button type="submit" size="lg" className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white" disabled={busy}>
              {busy ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Creating…</> : <><Users className="h-4 w-4 mr-2" />Create Club</>}
            </Button>
          </form>
        </Form>
      </ClaimRouteShell>

      <PinDialog {...action.pinDialogProps} title="Create club" description="Enter your PIN to create this club onchain." />
      <WalletSetupGate action={action} />
    </>
  );
}
