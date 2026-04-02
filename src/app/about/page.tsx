import type { Metadata } from "next";
import Link from "next/link";
import { Shield, Zap, Globe, Users, Bot, BookOpen } from "lucide-react";

export const metadata: Metadata = {
  title: "About | Medialane",
  description: "Learn about Medialane — the IP marketplace and creator launchpad built on the Mediolano protocol and Starknet.",
};

const PILLARS = [
  {
    icon: Shield,
    title: "IP Protection First",
    description:
      "Every asset on Medialane is anchored to the Mediolano protocol — a permissionless IP protection layer aligned with the Berne Convention. Creators get automatic copyright recognition in 181 countries, with programmable licenses enforced onchain.",
  },
  {
    icon: Zap,
    title: "Gasless by Default",
    description:
      "Powered by ChipiPay and Starknet's account abstraction, Medialane removes friction from every interaction. Sign in with email, mint, trade, and earn — without managing seed phrases or paying gas. Passkey (biometric) support included.",
  },
  {
    icon: Globe,
    title: "Built on Starknet",
    description:
      "Starknet's ZK-rollup technology gives Medialane the security of Ethereum at a fraction of the cost. Every transaction is provably valid. Zero-knowledge proofs protect privacy while maintaining full on-chain transparency.",
  },
  {
    icon: Bot,
    title: "AI Agent Ready",
    description:
      "Autonomous agents are first-class participants. AI entities can register IP, scan licenses, generate derivatives, and participate in the marketplace — with the same accountability and transparency as human creators.",
  },
  {
    icon: Users,
    title: "Community Governed",
    description:
      "Medialane DAO LLC is being bootstrapped in Utah. The path to full autonomy means creators, collectors, and developers will collectively own and govern the platform through transparent on-chain proposals and voting.",
  },
  {
    icon: BookOpen,
    title: "Open Protocol",
    description:
      "The Mediolano protocol at the core of Medialane is fully open source. Smart contracts, indexer, and SDK are publicly verifiable. No hidden logic, no vendor lock-in — your IP records exist permanently on Starknet.",
  },
];

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 pt-12 pb-16 max-w-6xl space-y-16">

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
          and developers an open protocol to build on — gasless, permissionless, and
          governed by its community.
        </p>
      </div>

      {/* Mediolano relationship */}
      <div className="bento-cell p-8 space-y-4">
        <h2 className="text-xl font-bold">Built on the Integrity Web</h2>
        <p className="text-muted-foreground leading-relaxed">
          Medialane is built on{" "}
          <strong className="text-foreground">Mediolano</strong> — a permissionless,
          open-source IP protection and licensing protocol. Mediolano was created as a
          <strong className="text-foreground"> public good</strong>: zero fees, community-owned,
          focused purely on giving creators cryptographic proof of ownership and programmable
          licensing rights — without any financial layer attached.
        </p>
        <p className="text-muted-foreground leading-relaxed">
          Medialane is the full picture. It takes Mediolano's integrity infrastructure
          and adds everything a creator economy needs: a marketplace to trade IP, a
          launchpad to deploy collections and drops, tools to earn royalties, and a
          community to participate in. The two are philosophically unified — Medialane's
          compliance with the Integrity Web philosophy is what makes it trustworthy.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <div className="bento-cell p-4 space-y-1.5">
            <p className="text-sm font-semibold text-foreground">Mediolano Protocol</p>
            <p className="text-xs text-muted-foreground">Permissionless IP protection · Zero fees · Public good · Open source · Berne Convention aligned</p>
          </div>
          <div className="bento-cell p-4 space-y-1.5">
            <p className="text-sm font-semibold text-foreground">Medialane Platform</p>
            <p className="text-xs text-muted-foreground">Marketplace · Launchpad · POP Protocol · Collection Drop · Royalties · Gasless trading</p>
          </div>
        </div>
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
          and ownership indisputable — aligned with the{" "}
          <strong className="text-foreground">Berne Convention</strong>, which provides
          automatic copyright protection in <strong className="text-foreground">181 countries</strong>{" "}
          from the moment a work is created. No registration. No lawyers. No intermediaries.
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
          Smart contracts are written in <strong className="text-foreground">Cairo 2</strong>,
          Starknet's native language, and cover the full platform: marketplace, collection
          registry, POP Protocol, Collection Drop, on-chain comments, and gated content.
          All contracts are part of the open-source{" "}
          <strong className="text-foreground">mediolano-contracts</strong> ecosystem.
        </p>
        <p className="text-muted-foreground leading-relaxed">
          The off-chain layer is a high-performance indexer and REST API. The frontend is
          built with <strong className="text-foreground">Next.js 15</strong>. Authentication
          is handled by <strong className="text-foreground">Clerk</strong> with wallet
          derivation via <strong className="text-foreground">ChipiPay</strong> — including
          passkey (biometric) support, so users never manage seed phrases or private keys
          manually. All platform data is accessible through the open{" "}
          <strong className="text-foreground">Medialane SDK</strong>.
        </p>
      </div>

      {/* DAO */}
      <div className="bento-cell p-8 space-y-3">
        <h2 className="text-xl font-bold">Medialane DAO LLC</h2>
        <p className="text-muted-foreground leading-relaxed">
          Medialane DAO LLC is being bootstrapped in{" "}
          <strong className="text-foreground">Utah, USA</strong> as the legal entity
          that will govern the platform. This DAO LLC structure bridges on-chain governance
          with real-world legal recognition — giving community members liability protection
          while enabling fully autonomous, transparent governance over time.
        </p>
        <p className="text-muted-foreground leading-relaxed">
          The long-term vision: a platform owned and governed entirely by its community.
          Creators, collectors, developers, and autonomous agents collectively deciding
          the future of the IP economy — through on-chain proposals, voting, and a
          community treasury.
        </p>
        <div className="flex flex-wrap gap-3 pt-2">
          <a
            href="https://x.com/medialane_io"
            target="_blank" rel="noopener noreferrer"
            className="text-sm font-medium text-primary hover:underline"
          >
            Follow on X →
          </a>
          <a
            href="https://t.me/IntegrityWeb"
            target="_blank" rel="noopener noreferrer"
            className="text-sm font-medium text-primary hover:underline"
          >
            Join Telegram →
          </a>
          <Link href="/docs/governance" className="text-sm font-medium text-primary hover:underline">
            Read Governance Docs →
          </Link>
        </div>
      </div>

    </div>
  );
}
