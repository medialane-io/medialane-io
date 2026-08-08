import type { Metadata } from "next";
import Link from "next/link";
import { Sparkles, CheckCircle2, XCircle, Info, Shield, Coins } from "lucide-react";
import { ServiceFormShell } from "@medialane/ui";
import { GenesisMint } from "@/components/airdrop/genesis-mint";
import { AirdropClaimRail } from "@/components/airdrop/airdrop-claim-rail";
import { canonical } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Creator's Airdrop — Medialane",
  description: "Everything you need to know about the Medialane Creator's Airdrop — how participation works, what you earn, and how to join.",
  alternates: canonical("/airdrop"),
  openGraph: {
    title: "Creator's Airdrop — Medialane",
    description: "Everything you need to know about the Medialane Creator's Airdrop — how participation works, what you earn, and how to join.",
    url: "/airdrop",
    type: "website",
  },
};

const PHASES = [
  {
    label: "Distribution rounds",
    milestone: "Every $1,000",
    desc: "Each time the Creator's Fund reaches $1,000, that amount is airdropped to all participants. Every dollar of revenue is returned — $5,000 means 5 rounds, $10,000 means 10.",
    gradient: "from-brand-blue to-brand-purple",
  },
  {
    label: "Your share",
    milestone: "Score Board points",
    desc: "Each round is split by Score Board points. You earn points by creating, trading, and engaging on Medialane — your points are your share of every distribution.",
    gradient: "from-brand-purple to-brand-rose",
  },
];

export default function AirdropPage() {
  return (
    <>
      <ServiceFormShell
        icon={<Sparkles className="h-4 w-4 text-white" />}
        title="Creator's Fund"
        subtitle="Join the airdrop. Every dollar of platform revenue comes back to participants."
        headerAccessory={
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-orange animate-pulse" />
            Live · runs through Jul 2027
          </span>
        }
        aside={<AirdropClaimRail />}
      >
        <GenesisMint />
      </ServiceFormShell>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-20 space-y-10">

        {/* ── Distribution ── */}
        <section className="pt-4 border-t border-border/30 space-y-6">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">Distribution</p>
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">How distribution works</h2>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
              Every $1,000 the Creator&apos;s Fund collects is airdropped to participants — weighted by Score Board points.
              See how XP determines your share on the{" "}
              <Link href="/rewards" className="text-foreground underline underline-offset-2 hover:text-brand-orange transition-colors">
                Rewards
              </Link>{" "}
              page.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {PHASES.map(({ label, milestone, desc, gradient }) => (
              <div key={label} className="relative rounded-2xl border border-border/40 bg-card overflow-hidden p-5 space-y-3">
                <div className={`absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r ${gradient}`} />
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-lg">{label}</p>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-muted/50 text-muted-foreground">{milestone}</span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
          <div className="rounded-2xl border border-border/40 bg-muted/10 p-4 flex items-start gap-3">
            <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
            <p className="text-sm text-muted-foreground leading-relaxed">
              The Creator&apos;s Airdrop campaign runs until July 1, 2027. All platform revenue collected during that window is returned to participants.
            </p>
          </div>
          <a
            href="https://medialane.org/creators-fund"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-2xl border border-border/40 bg-muted/10 p-4 flex items-start gap-3 hover:border-border transition-colors"
          >
            <Coins className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
            <p className="text-sm text-muted-foreground leading-relaxed">
              The Creator&apos;s Fund is a public wallet — track its live balance and every airdrop at <span className="text-foreground font-medium">medialane.org/creators-fund</span>.
              <span className="block tabular-nums text-xs mt-1 break-all">0x064c51746dbcb7498cc6e4b8abfcacd60805c0762b0411bb0515c611b5ae8223</span>
            </p>
          </a>
        </section>

        {/* ── Rules + Disclaimer ── */}
        <section className="pt-4 border-t border-border/30">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">

            {/* Rules */}
            <div className="space-y-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">Rules</p>
                <h2 className="text-2xl font-semibold tracking-tight">Participation rules</h2>
              </div>

              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-widest text-brand-blue">Who can join</p>
                <div className="space-y-2">
                  {[
                    "Anyone who creates a free Medialane account.",
                    "No ID, no card, no approval required.",
                  ].map((text) => (
                    <div key={text} className="flex items-start gap-3">
                      <div className="h-5 w-5 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0 mt-0.5">
                        <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                      </div>
                      <span className="text-sm text-muted-foreground leading-relaxed">{text}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-widest text-destructive/70">What gets you removed</p>
                <div className="space-y-2">
                  {[
                    "Automated bots or duplicate registrations.",
                    "Artificially inflating activity or scores.",
                  ].map((text) => (
                    <div key={text} className="flex items-start gap-3">
                      <div className="h-5 w-5 rounded-full bg-destructive/10 flex items-center justify-center shrink-0 mt-0.5">
                        <XCircle className="h-3 w-3 text-destructive" />
                      </div>
                      <span className="text-sm text-muted-foreground leading-relaxed">{text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Disclaimer */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-2xl font-semibold tracking-tight">Disclaimer</h2>
              </div>
              <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
                <p>Medialane is a content publishing and creator rewards platform. This campaign is not a financial product, investment scheme, lottery, or gambling service.</p>
                <p>Participation does not guarantee any financial return. Fund distributions, if any occur, may take the form of platform credits, digital assets, or other community resources.</p>
                <p>The participation record is a digital record of community membership. It has no inherent monetary value and is not a financial instrument.</p>
                <p>
                  By participating you agree to the{" "}
                  <a href="https://docs.medialane.io/guidelines/campaign-terms" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-foreground transition-colors">Campaign Terms</a>
                  {" "}and{" "}
                  <a href="https://docs.medialane.io/guidelines/terms" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-foreground transition-colors">Terms of Service</a>.
                </p>
              </div>
            </div>

          </div>
        </section>
      </div>
    </>
  );
}
