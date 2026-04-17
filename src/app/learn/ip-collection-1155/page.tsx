import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "IP Collection 1155 | Learn | Medialane",
  description: "Learn how to deploy a multi-edition ERC-1155 IP collection on Medialane — mint music tracks, art series, and creative editions.",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h2 className="text-xl font-bold">{title}</h2>
      <div className="text-muted-foreground leading-relaxed space-y-3">{children}</div>
    </div>
  );
}

export default function LearnIPCollection1155Page() {
  return (
    <div className="space-y-10">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">IP Collection 1155</h2>
        <p className="text-muted-foreground text-lg leading-relaxed">
          IP Collection 1155 is Medialane&apos;s multi-edition format — built on the ERC-1155
          token standard. Deploy a single collection contract and mint unlimited token
          editions into it, each with its own artwork, supply, and metadata.
        </p>
      </div>

      <div className="space-y-8">
        <Section title="The Printing Press Analogy">
          <p>
            Think of ERC-1155 as a printing press. A physical painting is one-of-a-kind —
            there is only one original, one owner, one provenance record. That is ERC-721.
          </p>
          <p>
            A printing press lets you produce 100 identical copies of a magazine. Each
            reader holds an authentic copy — verifiable, numbered, and owned — but they
            are not unique from one another. That is ERC-1155.
          </p>
          <p>
            IP Collection 1155 brings this model onchain. You own the press. Each token
            edition you mint defines how many copies exist and who can hold them.
          </p>
        </Section>

        <Section title="How It Works">
          <p>
            The flow has two steps: deploy the collection once, then mint editions into it
            whenever you have new creative work to release.
          </p>
          <div className="bento-cell px-4 py-3 space-y-1">
            <p className="text-sm font-semibold text-foreground">Step 1 — Deploy a collection</p>
            <p className="text-xs leading-relaxed">
              From <strong>Launchpad → IP Collection 1155 → Create Collection</strong>, choose a name,
              symbol, and upload a collection image. Medialane deploys an ERC-1155 contract
              to Starknet mainnet — owned entirely by your wallet. The collection appears
              in your Portfolio and on the Launchpad under &quot;Your IP Collections&quot;.
            </p>
          </div>
          <div className="bento-cell px-4 py-3 space-y-1">
            <p className="text-sm font-semibold text-foreground">Step 2 — Mint token editions</p>
            <p className="text-xs leading-relaxed">
              Click <strong>Mint</strong> next to your collection on the Launchpad. Upload
              the asset file, set a title, description, and supply — how many copies of
              this edition should exist. Each mint call writes a new token ID to your
              collection contract on-chain, with the metadata and edition count permanently
              anchored to IPFS.
            </p>
          </div>
        </Section>

        <Section title="What You Can Mint">
          <p>
            Any creative work that naturally exists in multiple copies is a good fit for
            IP Collection 1155:
          </p>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>Music tracks — release 100 copies of a new single</li>
            <li>Art editions — limited prints of a digital artwork</li>
            <li>Photo series — a set of images, each available to multiple collectors</li>
            <li>Short films or video clips with a defined release count</li>
            <li>Written works — essays, poems, or short stories in numbered editions</li>
            <li>Membership access passes — tiered or uniform</li>
          </ul>
        </Section>

        <Section title="ERC-1155 vs ERC-721 — When to Choose Which">
          <div className="space-y-2">
            <div className="bento-cell px-4 py-3 space-y-1">
              <p className="text-sm font-semibold text-foreground">Choose ERC-721 when uniqueness is the value</p>
              <p className="text-xs leading-relaxed">
                1-of-1 artworks, IP certificates, high-value collectibles where provable
                scarcity is the point. Each collector owns something no one else can.
              </p>
            </div>
            <div className="bento-cell px-4 py-3 space-y-1">
              <p className="text-sm font-semibold text-foreground">Choose ERC-1155 when editions are the format</p>
              <p className="text-xs leading-relaxed">
                Creative work you want many people to own authentically — music, prints,
                passes. Every holder owns a real, on-chain copy of the same edition.
              </p>
            </div>
          </div>
        </Section>

        <Section title="Onchain Ownership and Provenance">
          <p>
            Every IP Collection 1155 contract is deployed directly to Starknet mainnet.
            Your wallet address is the contract owner — no Medialane account required to
            hold or transfer the assets after minting.
          </p>
          <p>
            All token metadata is stored on IPFS with a content-addressed identifier (CID)
            anchored to the onchain token. The artwork and edition count cannot be changed
            after minting. Every transfer is permanently recorded.
          </p>
          <p>
            Collections are immediately discoverable on the Medialane marketplace and
            indexed in the platform&apos;s collection registry — visible to collectors and
            verifiable by anyone.
          </p>
        </Section>
      </div>
    </div>
  );
}
