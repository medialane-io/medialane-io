import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Zap, Shield, Globe } from "lucide-react";

const FEATURES = [
  {
    icon: Zap,
    title: "Gasless transactions",
    description: "All gas fees are sponsored. Mint, buy, and sell without holding crypto.",
  },
  {
    icon: Shield,
    title: "Invisible wallet",
    description: "Sign in with email — your Starknet wallet is created automatically, secured by PIN.",
  },
  {
    icon: Globe,
    title: "On-chain IP rights",
    description: "Every asset carries programmable licensing terms enforced by smart contracts.",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden py-24 lg:py-36">
        {/* Gradient orbs */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-1/4 -left-1/4 h-1/2 w-1/2 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute -bottom-1/4 -right-1/4 h-1/2 w-1/2 rounded-full bg-purple-500/10 blur-3xl" />
        </div>

        <div className="container relative mx-auto px-4 text-center">
          <div className="mx-auto max-w-4xl space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/30 px-4 py-1.5 text-sm backdrop-blur-sm">
              <Zap className="h-3.5 w-3.5 text-yellow-400" />
              <span>Powered by Starknet · Gas-free for creators</span>
            </div>

            <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl">
              <span className="text-foreground">Launch & monetize</span>
              <br />
              <span className="bg-gradient-to-r from-primary via-purple-400 to-pink-400 bg-clip-text text-transparent">
                your creative IP
              </span>
            </h1>

            <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
              Medialane is the creator launchpad for programmable intellectual property on Starknet.
              No seed phrases, no gas fees — just sign in and create.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
              <Button size="lg" className="rounded-full px-8" asChild>
                <Link href="/marketplace">
                  Explore marketplace <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="rounded-full px-8" asChild>
                <Link href="/create">Start creating</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="rounded-xl border border-border bg-card p-6 space-y-3 hover:border-primary/30 transition-colors"
            >
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold text-lg">{title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-16">
        <div className="rounded-2xl bg-gradient-to-br from-primary/10 via-purple-500/5 to-background border border-primary/20 p-12 text-center space-y-6">
          <h2 className="text-3xl font-bold">Ready to launch your IP?</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Create your invisible wallet in seconds and start minting programmable IP assets.
          </p>
          <Button size="lg" className="rounded-full px-8" asChild>
            <Link href="/create/asset">Create your first asset</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
