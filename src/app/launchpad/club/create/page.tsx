"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { hash } from "starknet";
import { starknetProvider } from "@/lib/starknet";
import { Users, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { PinDialog } from "@/components/chipi/pin-dialog";
import { useWriteAction } from "@/hooks/use-write-action";
import { WalletSetupGate } from "@/components/transaction/wallet-setup-gate";
import { useUser } from "@clerk/nextjs";
import { STARKNET_IP_CLUB_FACTORY_CONTRACT, MEDIALANE_BACKEND_URL } from "@/lib/constants";
import { getTokenBySymbol, normalizeAddress } from "@medialane/sdk";
import { serializeByteArray, encodeU256 } from "@/lib/cairo-calldata";
import { LaunchpadSuccessState, LaunchpadErrorState, LaunchpadProcessingState } from "@/components/launchpad/launchpad-success-state";
import { rewardToast } from "@/lib/reward-toast";
import { ClaimRouteShell } from "@/components/claim/claim-route-shell";
import { MedialaneCollectionCard } from "@medialane/ui";
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
    if (!STARKNET_IP_CLUB_FACTORY_CONTRACT) {
      toast.error("IP Club factory not configured");
      return;
    }
    void action.run(async (secret) => {
      const fee = values.entryFeeAmount ? Number(values.entryFeeAmount) : 0;
      const token = fee > 0 ? getTokenBySymbol(values.paymentToken) : null;
      if (fee > 0 && !token) throw new Error("Unsupported payment token");

      // Factory deploys a standalone IPClubCollection ERC-721. The user-supplied
      // ipfs:// metadata URI is the on-chain base_uri (the club IS a collection).
      // deploy_club(name, symbol, base_uri, max_supply:u256, entry_fee:u256,
      //             payment_token:Option<addr>, royalty_bps:u256)
      const maxSupply = values.maxMembers ? BigInt(values.maxMembers) : 0xffffffffffffffffn; // unlimited
      const entryFee = fee > 0 && token ? BigInt(Math.round(fee * 10 ** token.decimals)) : 0n;
      const paymentTokenOpt = entryFee > 0n && token ? ["0", token.address] : ["1"];

      const result = await action.executeTransaction({
        pin: secret,
        calls: [{
          contractAddress: STARKNET_IP_CLUB_FACTORY_CONTRACT,
          entrypoint: "deploy_club",
          calldata: [
            ...serializeByteArray(values.name),
            ...serializeByteArray(values.symbol),
            ...serializeByteArray(values.metadataUri),
            ...encodeU256(maxSupply),
            ...encodeU256(entryFee),
            ...paymentTokenOpt,
            ...encodeU256(0n), // royalty_bps — default 0
          ],
        }],
      });
      if (result.status !== "confirmed") {
        throw new Error(result.revertReason ?? "Transaction reverted");
      }
      rewardToast("create_club");

      // Parse ClubDeployed (keys = [selector, collection_address, owner]) and
      // fast-path register so the new club appears in browse before the indexer
      // catches up. Best-effort — the tx already confirmed.
      try {
        type ReceiptEvent = { keys?: string[] };
        type ReceiptShape = { events?: ReceiptEvent[] };
        let receipt: ReceiptShape | null = null;
        for (let attempt = 0; attempt < 2 && !receipt; attempt++) {
          try {
            if (attempt > 0) await new Promise((r) => setTimeout(r, 2000));
            receipt = (await starknetProvider.getTransactionReceipt(result.txHash)) as ReceiptShape;
          } catch { /* retry */ }
        }
        const selector = hash.getSelectorFromName("ClubDeployed");
        const deployEvent = (receipt?.events ?? []).find(
          (e) => e.keys?.[0] && BigInt(e.keys[0]) === BigInt(selector)
        );
        const addr = deployEvent?.keys?.[1] ? normalizeAddress("STARKNET", deployEvent.keys[1]) : null;
        if (addr) {
          await fetch(`${MEDIALANE_BACKEND_URL}/v1/collections/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contractAddress: addr,
              startBlock: 0,
              standard: "ERC721",
              source: "MEDIALANE_IP_CLUB",
            }),
          });
        }
      } catch { /* non-fatal — indexer will pick the club up on its next poll */ }

      return result;
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
        accentClassName="bg-brand-indigo/10"
        iconClassName="text-brand-indigo"
        actionClassName="bg-brand-indigo hover:brightness-110 text-white"
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
        iconClassName="text-brand-indigo"
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
        aside={
          <>
            <MedialaneCollectionCard
              name={form.watch("name")}
              collection={form.watch("symbol") || "Club"}
            />
            <CreateClubAside />
          </>
        }
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
            <Button type="submit" size="lg" className="w-full rounded-xl bg-brand-indigo hover:brightness-110 text-white" disabled={busy}>
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
