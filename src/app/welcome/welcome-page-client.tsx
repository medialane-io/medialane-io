"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { CheckCircle2, Sparkles, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LaunchMint } from "@/components/launch-mint";
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

  // Returning visit — no fresh flag → show LaunchMint directly
  if (!isFresh) {
    return (
      <div className="container mx-auto px-4 sm:px-6 py-12 max-w-5xl pb-20">
        <LaunchMint />
      </div>
    );
  }

  // Fresh onboarding celebration
  return (
    <div className="container mx-auto px-4 sm:px-6 py-12 max-w-2xl space-y-10 pb-20">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-xl shadow-primary/30 mx-auto">
          <Sparkles className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-4xl font-black">Welcome to Medialane</h1>
        <p className="text-lg text-muted-foreground">Your account is live on Starknet.</p>
      </div>

      {/* Status rows */}
      <div className="rounded-2xl border border-border bg-card/50 divide-y divide-border overflow-hidden">
        {/* Account created */}
        <div className="flex items-center gap-3 px-5 py-4">
          <div className="h-8 w-8 rounded-full bg-emerald-500/15 flex items-center justify-center shrink-0">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </div>
          <div>
            <p className="font-semibold text-sm">Account created</p>
            <p className="text-xs text-muted-foreground">Authenticated with Clerk</p>
          </div>
        </div>

        {/* Wallet secured */}
        <div className="flex items-center gap-3 px-5 py-4">
          <div className="h-8 w-8 rounded-full bg-emerald-500/15 flex items-center justify-center shrink-0">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </div>
          <div>
            <p className="font-semibold text-sm">Wallet secured on Starknet</p>
            <p className="text-xs text-muted-foreground">Invisible wallet powered by ChipiPay</p>
          </div>
        </div>

        {/* Genesis NFT */}
        {mintTxHash ? (
          <div className="flex items-center gap-3 px-5 py-4">
            <div className="h-8 w-8 rounded-full bg-emerald-500/15 flex items-center justify-center shrink-0">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm">Genesis NFT minted</p>
              <a
                href={`${EXPLORER_URL}/tx/${mintTxHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors group mt-0.5"
              >
                <span className="font-mono">
                  {mintTxHash.slice(0, 12)}…{mintTxHash.slice(-8)}
                </span>
                <ExternalLink className="h-3 w-3 group-hover:text-primary transition-colors shrink-0" />
              </a>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 px-5 py-4">
            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
              <Sparkles className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <p className="font-semibold text-sm">Genesis NFT</p>
              <p className="text-xs text-muted-foreground">Claim your welcome gift below</p>
            </div>
          </div>
        )}
      </div>

      {/* LaunchMint shown when mint didn't complete during onboarding */}
      {!mintTxHash && (
        <section>
          <LaunchMint />
        </section>
      )}

      {/* CTAs */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button size="lg" className="flex-1" asChild>
          <Link href="/marketplace">Explore marketplace</Link>
        </Button>
        <Button size="lg" variant="outline" className="flex-1" asChild>
          <Link href="/create/asset">Create your first asset</Link>
        </Button>
      </div>
    </div>
  );
}
