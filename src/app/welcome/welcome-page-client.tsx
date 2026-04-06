"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { CheckCircle2, Sparkles, ExternalLink, LayoutGrid, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LaunchMint } from "@/components/launch-mint";
import { FadeIn, Stagger, StaggerItem } from "@/components/ui/motion-primitives";
import { EXPLORER_URL } from "@/lib/constants";

export function WelcomePageClient() {
  const { user, isLoaded } = useUser();
  const [isFresh, setIsFresh] = useState(false);
  const [mintTxHash, setMintTxHash] = useState<string | null>(null);

  // One-time read + clear of fresh onboarding flag
  useEffect(() => {
    const fresh = sessionStorage.getItem("ml_fresh_onboarding");
    if (fresh) {
      setIsFresh(true);
      sessionStorage.removeItem("ml_fresh_onboarding");
    }
  }, []);

  // Read genesis mint tx hash from localStorage (written by onboarding or LaunchMint)
  useEffect(() => {
    if (!isLoaded || !user?.id) return;
    const stored = localStorage.getItem(`ml_genesis_${user.id}`);
    if (stored) setMintTxHash(stored);
  }, [isLoaded, user?.id]);

  // Returning visit — no fresh flag → LaunchMint fills the available width
  if (!isFresh) {
    return <LaunchMint />;
  }

  // ── Fresh onboarding celebration ─────────────────────────────────────────

  const steps = [
    {
      done: true,
      label: "Account created",
      sub: "Authenticated with Clerk",
    },
    {
      done: true,
      label: "Wallet secured on Starknet",
      sub: "Invisible wallet powered by ChipiPay",
    },
    {
      done: !!mintTxHash,
      label: mintTxHash ? "Genesis NFT minted" : "Genesis NFT",
      sub: mintTxHash ? null : "Claim your welcome gift below",
      txHash: mintTxHash,
    },
  ];

  return (
    <div className="pb-20">
      {/* ── Header ── */}
      <FadeIn>
        <div className="max-w-2xl mx-auto px-4 pt-12 pb-8 text-center space-y-3">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-lg shadow-primary/30 mx-auto">
            <Sparkles className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-4xl font-black tracking-tight">Welcome to Medialane</h1>
          <p className="text-base text-muted-foreground">Your account is live on Starknet.</p>
        </div>
      </FadeIn>

      {/* ── Checklist ── */}
      <FadeIn delay={0.06}>
        <div className="max-w-2xl mx-auto px-4">
          <Stagger className="divide-y divide-border rounded-2xl border border-border bg-card/40 overflow-hidden">
            {steps.map((step, i) => (
              <StaggerItem key={i}>
                <div className="flex items-center gap-4 px-5 py-4">
                  <div className={`h-9 w-9 rounded-full flex items-center justify-center shrink-0 ${
                    step.done
                      ? "bg-emerald-500/15 ring-1 ring-emerald-500/30"
                      : "bg-muted ring-1 ring-border"
                  }`}>
                    {step.done ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    ) : (
                      <Sparkles className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{step.label}</p>
                    {step.txHash ? (
                      <a
                        href={`${EXPLORER_URL}/tx/${step.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors group mt-0.5"
                      >
                        <span className="font-mono">
                          {step.txHash.slice(0, 12)}…{step.txHash.slice(-8)}
                        </span>
                        <ExternalLink className="h-3 w-3 group-hover:text-primary transition-colors shrink-0" />
                      </a>
                    ) : step.sub ? (
                      <p className="text-xs text-muted-foreground">{step.sub}</p>
                    ) : null}
                  </div>
                  {step.done && (
                    <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 rounded-full px-2.5 py-0.5 shrink-0">
                      Done
                    </span>
                  )}
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </FadeIn>

      {/* ── LaunchMint — full available width, own container ── */}
      {!mintTxHash && (
        <FadeIn delay={0.14}>
          <div className="mt-8">
            <LaunchMint />
          </div>
        </FadeIn>
      )}

      {/* ── CTAs ── */}
      <FadeIn delay={0.2}>
        <div className="max-w-2xl mx-auto px-4 mt-8 flex flex-col sm:flex-row gap-3">
          <Button size="lg" className="flex-1 gap-2" asChild>
            <Link href="/marketplace">
              <LayoutGrid className="h-4 w-4" />
              Explore marketplace
            </Link>
          </Button>
          <Button size="lg" variant="outline" className="flex-1 gap-2" asChild>
            <Link href="/create/asset">
              <Pencil className="h-4 w-4" />
              Create your first asset
            </Link>
          </Button>
        </div>
      </FadeIn>
    </div>
  );
}
