import type { Metadata } from "next";
import { Coins, ShieldCheck } from "lucide-react";
import { ClaimGate } from "@/components/claim/claim-gate";
import { ClaimCollectionPanel } from "@/components/claim/claim-collection-panel";

export const metadata: Metadata = {
  title: "Claim Memecoin",
  description: "Already launched a coin on Starknet? Bring it to Medialane so people can discover and trade it.",
  openGraph: {
    title: "Claim Memecoin | Medialane",
    description: "Already launched a coin on Starknet? Bring it to Medialane so people can discover and trade it.",
    url: "/launchpad/memecoin",
    images: [{ url: "/og-image.jpg", width: 1200, height: 630, alt: "Claim a Memecoin on Medialane" }],
  },
};

const STEPS = [
  "Paste your coin's contract address.",
  "We check on-chain that the wallet you're signed in with owns it.",
  "Once approved, your coin appears on the Coins page and your creator profile.",
];

export default function MemecoinClaimPage() {
  return (
    <div className="container max-w-2xl mx-auto px-4 pt-24 pb-8 space-y-8">
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-brand-rose">
          <Coins className="h-5 w-5" />
          <span className="text-sm font-semibold uppercase tracking-wider">Claim Memecoin</span>
        </div>
        <h1 className="text-3xl font-bold">Claim your Memecoin</h1>
        <p className="text-muted-foreground">
          Already launched a coin on Starknet? Add it here so people can discover and trade it.
          Paste your coin&apos;s address — our team gives it a quick review, then it goes live on
          the Coins page and your creator profile.
        </p>
      </div>

      <ClaimGate>
        <ClaimCollectionPanel />
      </ClaimGate>

      <aside className="space-y-4 rounded-2xl border border-border/60 bg-muted/20 p-5">
        <p className="text-sm font-semibold">How it works</p>
        <ol className="space-y-3">
          {STEPS.map((s, i) => (
            <li key={i} className="flex gap-3 text-sm text-muted-foreground">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                {i + 1}
              </span>
              <span className="leading-relaxed">{s}</span>
            </li>
          ))}
        </ol>
        <div className="flex items-start gap-2 border-t border-border/40 pt-4 text-xs text-muted-foreground">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
          <span>Medialane never takes custody of your coin — claiming just links it to your account.</span>
        </div>
      </aside>
    </div>
  );
}
