"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Contract, type Abi } from "starknet";
import { starknetProvider } from "@/lib/starknet";
import { Handshake, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { PinDialog } from "@/components/chipi/pin-dialog";
import { useWriteAction } from "@/hooks/use-write-action";
import { WalletSetupGate } from "@/components/transaction/wallet-setup-gate";
import { useUser } from "@clerk/nextjs";
import { STARKNET_IP_SPONSORSHIP_CONTRACT } from "@/lib/constants";
import { IPSponsorshipABI, getTokenBySymbol } from "@medialane/sdk";
import { LaunchpadSuccessState, LaunchpadErrorState, LaunchpadProcessingState } from "@/components/launchpad/launchpad-success-state";
import { ClaimRouteShell } from "@/components/claim/claim-route-shell";
import { rewardToast } from "@/lib/reward-toast";
import { LaunchpadSignedOutState } from "@/components/launchpad/launchpad-signed-out-state";
import { Handshake as HandshakeAsideIcon, ShieldCheck, Coins, Gift } from "lucide-react";
import { ClaimRail } from "@/components/claim/claim-rail";
import { toast } from "sonner";

function CreateSponsorshipAside() {
  return (
    <ClaimRail
      included={[
        { icon: HandshakeAsideIcon, title: "Direct settlement", desc: "Sponsor pays you directly — no escrow, no middleman." },
        { icon: ShieldCheck, title: "Owner-verified", desc: "You must own the asset, checked on-chain when you create and when you accept." },
        { icon: Coins, title: "Open bidding", desc: "Any sponsor can bid, or invite one specific sponsor." },
      ]}
      steps={[
        "Choose the asset you're sponsoring and your terms",
        "Sponsors bid — you accept the one you want",
        "They receive a license, you receive payment",
      ]}
      trustIcon={Gift}
      trustLead="No escrow, ever."
      trust="The contract never holds funds — settlement is direct, sponsor to author."
    />
  );
}

const schema = z.object({
  nftContract: z.string().min(1, "Asset contract required").regex(/^0x[0-9a-fA-F]+$/, "Must be a valid Starknet address"),
  tokenId: z.string().regex(/^\d+$/, "Must be a positive integer"),
  minAmount: z.string().min(1, "Minimum amount required").refine((v) => !Number.isNaN(Number(v)) && Number(v) > 0, "Enter a valid amount"),
  paymentToken: z.string().default("USDC"),
  durationDays: z.string().regex(/^\d+$/, "Must be a positive integer").refine((v) => parseInt(v, 10) >= 1, "Minimum 1 day"),
  licenseTermsUri: z.string().min(1, "License terms URI required").regex(/^(ipfs|ar):\/\//, "Must start with ipfs:// or ar://"),
  transferable: z.boolean().default(true),
});
type FormValues = z.infer<typeof schema>;

export default function CreateSponsorshipOfferPage() {
  const { isSignedIn } = useUser();
  const action = useWriteAction();
  const busy = action.status === "processing" || action.status === "confirming";

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { nftContract: "", tokenId: "", minAmount: "", paymentToken: "USDC", durationDays: "30", licenseTermsUri: "", transferable: true },
  });

  const onSubmit = (values: FormValues) => {
    if (!STARKNET_IP_SPONSORSHIP_CONTRACT) {
      toast.error("IP Sponsorship not configured");
      return;
    }
    void action.run(async (secret) => {
      const token = getTokenBySymbol(values.paymentToken);
      if (!token) throw new Error("Unsupported payment token");

      const minAmountBigInt = BigInt(Math.round(Number(values.minAmount) * 10 ** token.decimals));
      const duration = Number(values.durationDays) * 86400;

      const sponsorship = new Contract(IPSponsorshipABI as unknown as Abi, STARKNET_IP_SPONSORSHIP_CONTRACT, starknetProvider);
      const call = sponsorship.populate("create_offer", [
        values.nftContract,
        BigInt(values.tokenId),
        minAmountBigInt,
        duration,
        token.address,
        values.licenseTermsUri,
        values.transferable,
        { None: undefined },
      ]);

      const result = await action.executeTransaction({
        pin: secret,
        calls: [{ contractAddress: STARKNET_IP_SPONSORSHIP_CONTRACT, entrypoint: "create_offer", calldata: call.calldata as string[] }],
      });
      if (result.status === "confirmed") rewardToast("create_sponsorship_offer");
      return result;
    });
  };

  if (action.status === "error") {
    return <LaunchpadErrorState description={action.error ?? "Failed to create sponsorship offer"} backHref="/launchpad/sponsorship" backLabel="Back to Sponsorship launchpad" onRetry={action.reset} />;
  }
  if (busy) return <LaunchpadProcessingState title="Creating your sponsorship offer…" />;

  if (action.status === "success") {
    return (
      <LaunchpadSuccessState
        icon={CheckCircle2}
        accentClassName="bg-rose-500/10"
        iconClassName="text-rose-500"
        actionClassName="bg-rose-600 hover:bg-rose-700 text-white"
        title="Offer created"
        description="Your sponsorship offer is live onchain. It will appear in the launchpad within a minute once indexed."
        backHref="/launchpad/sponsorship"
        backLabel="Back to Sponsorship launchpad"
        actionLabel="Create another"
        onAction={() => { action.reset(); form.reset(); }}
      />
    );
  }

  if (!isSignedIn) {
    return (
      <LaunchpadSignedOutState
        icon={Handshake}
        iconClassName="text-rose-500"
        title="Sign in to create a sponsorship offer"
        description="Sign in to publish your offer onchain."
      />
    );
  }

  return (
    <>
      <ClaimRouteShell
        gated={false}
        icon={<Handshake className="h-4 w-4 text-white" />}
        title="Sponsor Your Work"
        subtitle="Create a sponsorship offer on an asset you own — sponsors bid, you accept, they receive a license."
        aside={<CreateSponsorshipAside />}
      >
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField control={form.control} name="nftContract" render={({ field }) => (
              <FormItem>
                <FormLabel>Asset contract *</FormLabel>
                <FormControl><Input placeholder="0x…" {...field} /></FormControl>
                <FormDescription>The contract address of the asset you own and want to sponsor.</FormDescription>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="tokenId" render={({ field }) => (
              <FormItem>
                <FormLabel>Token ID *</FormLabel>
                <FormControl><Input type="number" min={0} {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <div className="flex gap-3">
              <FormField control={form.control} name="minAmount" render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel>Minimum bid *</FormLabel>
                  <FormControl><Input type="number" min={0} step="0.01" {...field} /></FormControl>
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
            <FormField control={form.control} name="durationDays" render={({ field }) => (
              <FormItem>
                <FormLabel>License duration (days) *</FormLabel>
                <FormControl><Input type="number" min={1} {...field} /></FormControl>
                <FormDescription>Counted from when a bid is accepted, not from now.</FormDescription>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="licenseTermsUri" render={({ field }) => (
              <FormItem>
                <FormLabel>License terms URI *</FormLabel>
                <FormControl><Input placeholder="ipfs://bafybei…" {...field} /></FormControl>
                <FormDescription>ipfs:// or ar:// only — enforced on-chain.</FormDescription>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="transferable" render={({ field }) => (
              <FormItem className="flex items-center gap-2 space-y-0">
                <FormControl>
                  <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
                <FormLabel className="font-normal">Sponsor can transfer this license to someone else</FormLabel>
              </FormItem>
            )} />
            <Button type="submit" size="lg" className="w-full rounded-xl bg-rose-600 hover:bg-rose-700 text-white" disabled={busy}>
              {busy ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Creating…</> : <><Handshake className="h-4 w-4 mr-2" />Create Offer</>}
            </Button>
          </form>
        </Form>
      </ClaimRouteShell>

      <PinDialog {...action.pinDialogProps} title="Create sponsorship offer" description="Enter your PIN to publish this offer onchain." />
      <WalletSetupGate action={action} />
    </>
  );
}
