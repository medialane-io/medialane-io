import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Protocol | Docs | Medialane",
  description: "Technical specification of the Medialane onchain protocol — contracts, events, data structures, and standards.",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h2 className="text-xl font-bold">{title}</h2>
      <div className="text-muted-foreground leading-relaxed space-y-3">{children}</div>
    </div>
  );
}

function Code({ children }: { children: string }) {
  return (
    <pre className="bento-cell p-4 text-xs font-mono overflow-x-auto text-foreground/80 leading-relaxed">
      {children}
    </pre>
  );
}

export default function DocsProtocolPage() {
  return (
    <div className="space-y-10 max-w-3xl">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Protocol Specification</h2>
        <p className="text-muted-foreground text-lg leading-relaxed">
          The Medialane protocol consists of two onchain contracts on Starknet mainnet
          and an off-chain indexer/API layer. This document describes the contracts,
          their interfaces, and the event model used by the indexer.
        </p>
      </div>

      <div className="space-y-8">
        <Section title="Contracts (Starknet Mainnet)">
          <div className="space-y-2">
            <div className="bento-cell px-4 py-3 space-y-1">
              <p className="text-sm font-semibold text-foreground">Marketplace Contract</p>
              <p className="font-mono text-xs text-muted-foreground break-all">
                0x059deafbbafbf7051c315cf75a94b03c5547892bc0c6dfa36d7ac7290d4cc33a
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Handles order creation, fulfillment, cancellation, and royalty distribution.
              </p>
            </div>
            <div className="bento-cell px-4 py-3 space-y-1">
              <p className="text-sm font-semibold text-foreground">Collection Registry Contract</p>
              <p className="font-mono text-xs text-muted-foreground break-all">
                0x05e73b7be06d82beeb390a0e0d655f2c9e7cf519658e04f05d9c690ccc41da03
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Factory for deploying IP NFT collections and registry for onchain collection IDs.
              </p>
            </div>
          </div>
        </Section>

        <Section title="NFT Standard">
          <p>
            Medialane collections implement <strong className="text-foreground">SNIP-2</strong>,
            the Starknet equivalent of ERC-721. Each token has a unique{" "}
            <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">token_id</code> (u256)
            and a <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">token_uri</code>{" "}
            returning a ByteArray pointing to IPFS metadata.
          </p>
          <p>
            The metadata JSON conforms to the OpenSea/ERC-721 metadata standard with
            Medialane-specific extensions for licensing attributes (see below).
          </p>
        </Section>

        <Section title="Metadata Schema">
          <Code>{`{
  "name": "My IP Asset",
  "description": "A description of the work.",
  "image": "ipfs://bafybei...",
  "attributes": [
    { "trait_type": "IP Type",          "value": "Visual Art" },
    { "trait_type": "License",          "value": "CC BY-NC-SA 4.0" },
    { "trait_type": "Commercial Use",   "value": "Not Allowed" },
    { "trait_type": "Derivatives",      "value": "Allowed with Attribution" },
    { "trait_type": "AI Training",      "value": "Not Allowed" },
    { "trait_type": "Geographic Scope", "value": "Worldwide" },
    { "trait_type": "Royalty %",        "value": "10" }
  ]
}`}</Code>
        </Section>

        <Section title="SNIP-12 Typed Data (Order Signing)">
          <p>
            All marketplace intents (listings, offers, fulfillments, cancellations) use
            SNIP-12 typed data for off-chain signing. The domain separator is:
          </p>
          <Code>{`{
  "name": "Medialane",
  "version": "1",
  "revision": "1",
  "chainId": "SN_MAIN"
}`}</Code>
          <p>
            The indexer validates submitted signatures onchain before recording orders.
            Fulfilled and cancelled orders are reconciled from onchain events emitted by
            the marketplace contract.
          </p>
        </Section>

        <Section title="Marketplace Events">
          <p>The marketplace contract emits the following events, indexed by the Medialane mirror:</p>
          <div className="space-y-2 text-sm">
            {[
              ["OrderCreated", "Emitted when a listing or offer intent is submitted. Contains order_hash only — full params fetched via get_order_details()."],
              ["OrderFulfilled", "Emitted when a buyer executes a listing or a creator accepts an offer."],
              ["OrderCancelled", "Emitted when an order is cancelled by the maker."],
            ].map(([name, desc]) => (
              <div key={name} className="bento-cell px-4 py-3 space-y-1">
                <code className="text-xs font-mono text-foreground">{name}</code>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Collection Registry Events">
          <div className="space-y-2 text-sm">
            <div className="bento-cell px-4 py-3 space-y-1">
              <code className="text-xs font-mono text-foreground">CollectionCreated</code>
              <p className="text-xs text-muted-foreground">
                Emitted when a new collection is deployed through the factory.
                Data contains <code className="font-mono">collection_id</code> (u256 low/high),
                owner address, and name/symbol/base_uri ByteArrays.
                The actual ERC-721 contract address (<code className="font-mono">ip_nft</code>) is
                resolved by calling <code className="font-mono">get_collection(collection_id)</code>
                on the registry.
              </p>
            </div>
          </div>
        </Section>

        <Section title="Indexer Architecture">
          <p>
            The Medialane off-chain layer consists of three components running as a single
            Bun process:
          </p>
          <ul className="list-disc list-inside space-y-1.5 text-sm">
            <li><strong className="text-foreground">Mirror</strong> — polls the Starknet RPC for new blocks, processes events, and writes to PostgreSQL</li>
            <li><strong className="text-foreground">Orchestrator</strong> — an in-memory worker that processes metadata fetch jobs (IPFS resolution, stats updates)</li>
            <li><strong className="text-foreground">API</strong> — a Hono REST server exposing all platform data to frontends and third-party integrations</li>
          </ul>
          <p>
            The indexer polls every ~6 seconds. Block lag is typically 1–3 blocks.
            New collections and order events appear in the API within one indexer tick
            of the transaction being confirmed.
          </p>
        </Section>
      </div>
    </div>
  );
}
