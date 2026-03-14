"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Paintbrush,
  ShoppingBag,
  Bot,
  Building2,
  Zap,
  Gift,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

const PARTICIPANT_TYPES = [
  {
    icon: Paintbrush,
    label: "Creators",
    description:
      "Mint your IP as NFTs, earn royalties automatically on every sale, and grow your audience on Starknet.",
    color: "text-brand-purple",
    bg: "bg-brand-purple/10",
  },
  {
    icon: ShoppingBag,
    label: "Collectors",
    description:
      "Discover rare digital IP assets, build your collection, and support creators you believe in.",
    color: "text-brand-blue",
    bg: "bg-brand-blue/10",
  },
  {
    icon: Bot,
    label: "AI Agents",
    description:
      "Register your AI agent on-chain. Participate in the first airdrop designed for autonomous agents.",
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
  },
  {
    icon: Building2,
    label: "Organizations",
    description:
      "Deploy collections for your brand, license content programmatically, and build on top of Medialane.",
    color: "text-brand-orange",
    bg: "bg-brand-orange/10",
  },
] as const;

const ROLES = ["creator", "collector", "agent", "organization", "other"] as const;

export function AirdropSection() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<string>("creator");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/airdrop/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, role }),
      });
      if (!res.ok) throw new Error("Failed");
      setDone(true);
      toast.success(
        "You're registered! We'll be in touch before the airdrop reveals."
      );
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 rounded-full border border-brand-purple/30 bg-brand-purple/10 px-4 py-1.5 text-sm font-semibold text-brand-purple">
          <Gift className="h-4 w-4" />
          Airdrop Campaign
        </div>
        <h2 className="text-3xl sm:text-4xl font-black">
          Join the{" "}
          <span className="gradient-text">Medialane Airdrop</span>
        </h2>
        <p className="text-muted-foreground leading-relaxed">
          Create, collect, and build on Medialane to earn your allocation.
          The airdrop criteria will be revealed in H2 2026 — the earlier you
          participate, the better.
        </p>
      </div>

      {/* Participant type cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {PARTICIPANT_TYPES.map(({ icon: Icon, label, description, color, bg }) => (
          <div key={label} className="bento-cell p-5 space-y-3 flex flex-col">
            <div
              className={cn(
                "h-10 w-10 rounded-xl flex items-center justify-center",
                bg
              )}
            >
              <Icon className={cn("h-5 w-5", color)} />
            </div>
            <div className="space-y-1 flex-1">
              <p className="font-bold text-sm">{label}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {description}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Registration form */}
      <div className="bento-cell p-6 sm:p-8 max-w-xl mx-auto space-y-5">
        {done ? (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <Zap className="h-6 w-6 text-emerald-500" />
            </div>
            <p className="font-bold text-lg">You&apos;re in!</p>
            <p className="text-sm text-muted-foreground">
              We&apos;ll notify you before the airdrop criteria are revealed.
              Start using the platform to maximise your allocation.
            </p>
          </div>
        ) : (
          <>
            <div>
              <p className="font-bold text-base">Register your interest</p>
              <p className="text-sm text-muted-foreground mt-0.5">
                Be the first to know when the airdrop goes live.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <Input
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={loading}
              />
              <Input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />

              {/* Role selector */}
              <div className="flex flex-wrap gap-2">
                {ROLES.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors capitalize",
                      role === r
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border text-muted-foreground hover:border-primary/40"
                    )}
                  >
                    {r === "agent"
                      ? "AI Agent"
                      : r.charAt(0).toUpperCase() + r.slice(1)}
                  </button>
                ))}
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <ArrowRight className="h-4 w-4 mr-2" />
                )}
                {loading ? "Registering…" : "Register for airdrop"}
              </Button>
              <p className="text-[10px] text-center text-muted-foreground">
                No spam. Unsubscribe any time. Airdrop criteria revealed H2
                2026.
              </p>
            </form>
          </>
        )}
      </div>
    </section>
  );
}
