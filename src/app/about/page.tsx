import type { Metadata } from "next";
import { Shield, Zap, Globe, Users } from "lucide-react";

export const metadata: Metadata = {
  title: "About | Medialane",
  description: "Learn about Medialane — the IP marketplace and creator launchpad built on Starknet.",
};

const PILLARS = [
  {
    icon: Shield,
    title: "IP Protection First",
    description:
      "Every asset minted on Medialane is anchored to a programmable license encoded onchain. Creators define how their work can be used, shared, remixed, or commercialised — no lawyers required.",
  },
  {
    icon: Zap,
    title: "Gasless by Default",
    description:
      "Powered by ChipiPay and Starknet's account abstraction, Medialane removes the friction of gas fees and seed phrases. Sign in with email, mint, trade, and earn — without ever touching a crypto wallet.",
  },
  {
    icon: Globe,
    title: "Built on Starknet",
    description:
      "Starknet's ZK-rollup technology gives Medialane the security of Ethereum with a fraction of the cost. Every transaction is provably valid without revealing private data.",
  },
  {
    icon: Users,
    title: "Creator-Governed",
    description:
      "Medialane is building toward community governance. Creators, collectors, and developers will shape the platform's future through onchain proposals and collective decision-making.",
  },
];

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 pt-12 pb-16 max-w-4xl space-y-14">

      {/* Hero */}
      <div className="space-y-5">
        <span className="pill-badge">About Medialane</span>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-tight">
          The IP Marketplace for<br />
          <span className="gradient-text">the Creator Economy</span>
        </h1>
        <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl">
          Medialane is a Starknet-based platform for minting, licensing, and trading
          intellectual property as NFTs. We give creators ownership, collectors provenance,
          and developers an open protocol to build on.
        </p>
      </div>

      {/* Mission */}
      <div className="bento-cell p-8 space-y-3">
        <h2 className="text-xl font-bold">Our Mission</h2>
        <p className="text-muted-foreground leading-relaxed">
          The internet made creative work infinitely reproducible — but it never gave creators
          a reliable way to track ownership, enforce licenses, or capture the value of their
          ideas. Medialane exists to fix that. We believe every creative work deserves a
          permanent, verifiable record of authorship and a programmable set of rules for how
          it can be used.
        </p>
        <p className="text-muted-foreground leading-relaxed">
          By anchoring IP to blockchain, we make licensing transparent, royalties automatic,
          and ownership indisputable — without any of the complexity traditionally associated
          with crypto.
        </p>
      </div>

      {/* Pillars */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">What We Stand For</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {PILLARS.map(({ icon: Icon, title, description }) => (
            <div key={title} className="bento-cell p-6 space-y-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold">{title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Technology */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Technology Stack</h2>
        <p className="text-muted-foreground leading-relaxed">
          Medialane is built on <strong className="text-foreground">Starknet</strong>, an
          Ethereum Layer 2 network using ZK-STARK proofs for validity and scalability.
          Our smart contracts are written in <strong className="text-foreground">Cairo 2</strong>,
          Starknet&apos;s native language, and cover the full platform: marketplace, collection
          registry, POP Protocol, Collection Drop, on-chain comments, and gated content.
        </p>
        <p className="text-muted-foreground leading-relaxed">
          The off-chain layer is a high-performance indexer and REST API. The frontend is
          built with <strong className="text-foreground">Next.js 15</strong> and authentication
          is handled by <strong className="text-foreground">Clerk</strong> with wallet
          derivation via <strong className="text-foreground">ChipiPay</strong> — including
          passkey (biometric) support so users never need to manage private keys or
          remember seed phrases.
        </p>
        <p className="text-muted-foreground leading-relaxed">
          All platform data is accessible through the{" "}
          <strong className="text-foreground">Medialane SDK</strong> — an open TypeScript
          package that developers can use to build on top of the protocol.
        </p>
      </div>

      {/* Community */}
      <div className="bento-cell p-8 space-y-3">
        <h2 className="text-xl font-bold">Join the Community</h2>
        <p className="text-muted-foreground leading-relaxed">
          Medialane is in active development. Creators, collectors, and developers are
          welcome to participate, provide feedback, and shape the direction of the platform.
          Follow us on X, join our community channels, and reach out if you want to
          collaborate.
        </p>
        <div className="flex gap-3 pt-2">
          <a
            href="https://x.com/medialane_io"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-primary hover:underline"
          >
            Follow on X →
          </a>
        </div>
      </div>

    </div>
  );
}
