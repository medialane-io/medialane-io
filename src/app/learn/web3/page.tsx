import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Web3 & Starknet | Learn | Medialane",
  description: "A beginner-friendly introduction to blockchain, Web3, Starknet, and zero-knowledge proof technology.",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h2 className="text-xl font-bold">{title}</h2>
      <div className="text-muted-foreground leading-relaxed space-y-3">{children}</div>
    </div>
  );
}

export default function LearnWeb3Page() {
  return (
    <div className="space-y-10 max-w-3xl">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Web3 & Starknet</h2>
        <p className="text-muted-foreground text-lg leading-relaxed">
          Medialane is built on Starknet — a Layer 2 blockchain secured by zero-knowledge
          proofs. This page explains what that means and why it matters for creators.
        </p>
      </div>

      <div className="space-y-8">
        <Section title="What is a Blockchain?">
          <p>
            A blockchain is a shared database maintained by thousands of computers worldwide.
            Once data is written to a blockchain, it cannot be altered or deleted — every
            entry is permanent and publicly visible. No single company, government, or
            person controls it.
          </p>
          <p>
            This makes blockchains ideal for recording ownership. If your name is on the
            blockchain as the owner of an asset, that record stands without requiring you
            to trust a platform, registry, or intermediary to maintain it.
          </p>
        </Section>

        <Section title="What is Web3?">
          <p>
            Web3 is the name for the emerging internet built on public blockchains. In Web2
            (the current internet), your data is owned by platforms — Instagram, YouTube,
            Spotify. In Web3, your assets and identity are stored on-chain and you carry
            them with you across applications.
          </p>
          <p>
            A wallet address on a blockchain is like an email address — but instead of a
            company controlling the account, you control it through a cryptographic key pair.
            Medialane uses ChipiPay to derive this wallet from your existing email login,
            so you get Web3 ownership without the complexity of managing keys yourself.
          </p>
        </Section>

        <Section title="What is Starknet?">
          <p>
            Starknet is a Layer 2 (L2) network built on top of Ethereum. Ethereum is the
            most secure public blockchain in the world, but it can be slow and expensive
            to use directly. Starknet processes transactions off-chain in batches and
            submits a single cryptographic proof to Ethereum — inheriting its security
            at a fraction of the cost.
          </p>
          <p>
            Starknet is where Medialane&apos;s smart contracts live. When you mint an NFT,
            list an asset, or accept an offer, those transactions happen on Starknet and
            are settled with finality on Ethereum.
          </p>
        </Section>

        <Section title="What are Zero-Knowledge Proofs?">
          <p>
            A zero-knowledge proof (ZKP) is a cryptographic technique that lets one party
            prove to another that something is true without revealing the underlying
            information. Starknet uses STARK proofs — a specific type of ZKP — to prove
            that all transactions in a batch are valid without re-executing every one
            on Ethereum.
          </p>
          <p>
            For users, this means: lower fees, faster finality, and the same level of
            security as Ethereum mainnet. For developers, it means a programmable
            environment that can scale to millions of transactions per day.
          </p>
        </Section>

        <Section title="Smart Contracts and Cairo">
          <p>
            Smart contracts are programs that run on the blockchain. They execute automatically
            when certain conditions are met — no intermediary required. The Medialane
            marketplace contract enforces royalties, validates signatures, and executes
            asset transfers entirely through code, not through a human decision.
          </p>
          <p>
            Starknet smart contracts are written in <strong className="text-foreground">Cairo</strong>,
            a programming language designed specifically for generating STARK proofs.
            Medialane&apos;s contracts are open source and auditable by anyone.
          </p>
        </Section>

        <Section title="Account Abstraction">
          <p>
            Starknet natively supports account abstraction — a model where wallets are
            smart contracts themselves, not just key pairs. This enables features like
            session keys (SNIP-9), which allow applications to sign a limited set of
            transactions on your behalf for a defined period.
          </p>
          <p>
            Medialane uses session keys to let you approve a session once with your PIN
            and then execute multiple marketplace actions — minting, listing, buying —
            without re-entering your credentials each time. Sessions expire automatically
            for security.
          </p>
        </Section>
      </div>
    </div>
  );
}
