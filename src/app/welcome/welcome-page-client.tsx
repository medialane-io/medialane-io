"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import {
  CheckCircle2, Sparkles, ExternalLink, ShoppingBag,
  Pencil, Package, Award, ArrowRight, X, Zap, Shield, Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { LaunchMint } from "@/components/launch-mint";
import { FadeIn, Stagger, StaggerItem } from "@/components/ui/motion-primitives";
import { EXPLORER_URL } from "@/lib/constants";
import { cn } from "@/lib/utils";

// ── Journey cards ─────────────────────────────────────────────────────────────

const JOURNEYS = [
  {
    icon: ShoppingBag,
    label: "Explore the marketplace",
    description: "Buy, sell and collect programmable IP assets from creators worldwide.",
    href: "/marketplace",
    accent: "from-brand-blue/20 to-brand-blue/5 border-brand-blue/20",
    iconColor: "text-brand-blue",
    iconBg: "bg-brand-blue/10",
  },
  {
    icon: Pencil,
    label: "Create an IP asset",
    description: "Mint your music, art, or content on-chain with programmable licensing.",
    href: "/create/asset",
    accent: "from-brand-purple/20 to-brand-purple/5 border-brand-purple/20",
    iconColor: "text-brand-purple",
    iconBg: "bg-brand-purple/10",
  },
  {
    icon: Package,
    label: "Launch a drop",
    description: "Deploy a limited-edition NFT collection with custom mint conditions.",
    href: "/launchpad/drop/create",
    accent: "from-orange-500/20 to-orange-500/5 border-orange-500/20",
    iconColor: "text-orange-400",
    iconBg: "bg-orange-500/10",
  },
  {
    icon: Award,
    label: "Claim a POP credential",
    description: "Collect soulbound proof-of-participation NFTs from events you attended.",
    href: "/launchpad/pop",
    accent: "from-emerald-500/20 to-emerald-500/5 border-emerald-500/20",
    iconColor: "text-emerald-400",
    iconBg: "bg-emerald-500/10",
  },
] as const;

// ── Platform highlights ───────────────────────────────────────────────────────

const HIGHLIGHTS = [
  {
    icon: Zap,
    label: "Gasless transactions",
    description: "Gas fees sponsored on every action — no ETH needed, ever.",
  },
  {
    icon: Shield,
    label: "Programmable licensing",
    description: "Embed Berne Convention rights, royalties, and AI policy on-chain.",
  },
  {
    icon: Globe,
    label: "Starknet mainnet",
    description: "All assets are real, permanent, and permissionlessly verifiable.",
  },
] as const;

// ── Onboarding checklist (one-time) ──────────────────────────────────────────

function OnboardingBanner({
  mintTxHash,
  onDismiss,
}: {
  mintTxHash: string | null;
  onDismiss: () => void;
}) {
  const steps = [
    { done: true, label: "Account created", sub: "Authenticated with Clerk" },
    { done: true, label: "Wallet secured", sub: "Powered by ChipiPay on Starknet" },
    {
      done: !!mintTxHash,
      label: mintTxHash ? "Genesis NFT minted" : "Genesis NFT",
      sub: mintTxHash ? null : "Claim your welcome gift below",
      txHash: mintTxHash,
    },
  ];

  return (
    <FadeIn>
      <div className="max-w-5xl mx-auto px-4 pt-6">
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 relative">
          <button
            onClick={onDismiss}
            className="absolute top-3 right-3 h-6 w-6 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label="Dismiss"
          >
            <X className="h-3.5 w-3.5" />
          </button>
          <p className="text-xs font-bold uppercase tracking-widest text-emerald-400 mb-3">
            Setup complete
          </p>
          <div className="flex flex-wrap gap-4">
            {steps.map((step, i) => (
              <div key={i} className="flex items-center gap-2 min-w-0">
                <div className={cn(
                  "h-6 w-6 rounded-full flex items-center justify-center shrink-0",
                  step.done ? "bg-emerald-500/15" : "bg-muted"
                )}>
                  {step.done
                    ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                    : <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />
                  }
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold leading-none">{step.label}</p>
                  {step.txHash ? (
                    <a
                      href={`${EXPLORER_URL}/tx/${step.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors group mt-0.5"
                    >
                      <span className="font-mono">{step.txHash.slice(0, 10)}…</span>
                      <ExternalLink className="h-2.5 w-2.5 shrink-0" />
                    </a>
                  ) : step.sub ? (
                    <p className="text-[11px] text-muted-foreground mt-0.5">{step.sub}</p>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </FadeIn>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function WelcomePageClient() {
  const { user, isLoaded } = useUser();
  const [showBanner, setShowBanner] = useState(false);
  const [mintTxHash, setMintTxHash] = useState<string | null>(null);

  useEffect(() => {
    const fresh = sessionStorage.getItem("ml_fresh_onboarding");
    if (fresh) {
      setShowBanner(true);
      sessionStorage.removeItem("ml_fresh_onboarding");
    }
  }, []);

  useEffect(() => {
    if (!isLoaded || !user?.id) return;
    const stored = localStorage.getItem(`ml_genesis_${user.id}`);
    if (stored) setMintTxHash(stored);
  }, [isLoaded, user?.id]);

  const firstName = user?.firstName ?? user?.username ?? null;

  return (
    <div className="pb-24">

      {/* ── Onboarding checklist banner (first visit only) ── */}
      {showBanner && (
        <OnboardingBanner
          mintTxHash={mintTxHash}
          onDismiss={() => setShowBanner(false)}
        />
      )}

      {/* ── Hero ── */}
      <FadeIn delay={0.04}>
        <div className="max-w-5xl mx-auto px-4 pt-10 pb-2">
          <span className="pill-badge inline-flex gap-1.5 mb-3">
            <Sparkles className="h-3 w-3" />
            Welcome
          </span>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-tight">
            {firstName ? (
              <>Hey, {firstName}.<br />
              <span className="gradient-text">What are you creating today?</span></>
            ) : (
              <>Your IP,{" "}
              <span className="gradient-text">on-chain.</span></>
            )}
          </h1>
          <p className="mt-3 text-base text-muted-foreground max-w-xl">
            Medialane is the home for programmable intellectual property on Starknet.
            Mint, license, trade, and collect creative assets — with gas fees on us.
          </p>
        </div>
      </FadeIn>

      {/* ── Journey cards ── */}
      <FadeIn delay={0.1}>
        <div className="max-w-5xl mx-auto px-4 mt-8">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">
            Start here
          </p>
          <Stagger className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {JOURNEYS.map((j) => (
              <StaggerItem key={j.href}>
                <Link
                  href={j.href}
                  className={cn(
                    "group flex flex-col gap-3 p-5 rounded-2xl border bg-gradient-to-br transition-all duration-200",
                    "hover:shadow-lg hover:-translate-y-0.5",
                    j.accent
                  )}
                >
                  <div className={cn("h-9 w-9 rounded-xl flex items-center justify-center", j.iconBg)}>
                    <j.icon className={cn("h-4 w-4", j.iconColor)} />
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="font-bold text-sm leading-snug">{j.label}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{j.description}</p>
                  </div>
                  <div className={cn("flex items-center gap-1 text-xs font-semibold", j.iconColor)}>
                    <span>Go</span>
                    <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </Link>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </FadeIn>

      {/* ── Genesis NFT (if not yet minted) ── */}
      {!mintTxHash && (
        <FadeIn delay={0.16}>
          <div className="mt-10">
            <div className="max-w-5xl mx-auto px-4 mb-4">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Your welcome gift
              </p>
            </div>
            <LaunchMint />
          </div>
        </FadeIn>
      )}

      {/* ── Platform highlights ── */}
      <FadeIn delay={mintTxHash ? 0.16 : 0.22}>
        <div className="max-w-5xl mx-auto px-4 mt-10">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">
            Built different
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {HIGHLIGHTS.map((h) => (
              <div key={h.label} className="bento-cell p-5 space-y-2">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <h.icon className="h-4 w-4 text-primary" />
                </div>
                <p className="font-bold text-sm">{h.label}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{h.description}</p>
              </div>
            ))}
          </div>
        </div>
      </FadeIn>

      {/* ── Minted state: show tx + nav ── */}
      {mintTxHash && (
        <FadeIn delay={0.22}>
          <div className="max-w-5xl mx-auto px-4 mt-10">
            <div className="bento-cell p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm">Genesis NFT collected</p>
                <a
                  href={`${EXPLORER_URL}/tx/${mintTxHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors group mt-0.5"
                >
                  <span className="font-mono">{mintTxHash.slice(0, 16)}…{mintTxHash.slice(-8)}</span>
                  <ExternalLink className="h-3 w-3 group-hover:text-primary shrink-0" />
                </a>
              </div>
              <Button size="sm" variant="outline" asChild className="shrink-0">
                <Link href="/portfolio/assets">View in portfolio</Link>
              </Button>
            </div>
          </div>
        </FadeIn>
      )}

    </div>
  );
}
