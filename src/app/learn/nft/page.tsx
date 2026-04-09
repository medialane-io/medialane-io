import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "What is an NFT? | Learn | Medialane",
  description: "Learn what NFTs are, how they work on blockchain, and why they are powerful tools for creators protecting intellectual property.",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h2 className="text-xl font-bold">{title}</h2>
      <div className="text-muted-foreground leading-relaxed space-y-3">{children}</div>
    </div>
  );
}

export default function LearnNFTPage() {
  return (
    <div className="space-y-10">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">What is an NFT?</h2>
        <p className="text-muted-foreground text-lg leading-relaxed">
          A non-fungible token (NFT) is a unique digital record stored on a blockchain.
          Unlike cryptocurrencies — where one coin is interchangeable with any other —
          each NFT is distinct and represents ownership of a specific digital or real-world asset.
        </p>
      </div>

      <div className="space-y-8">
        <Section title="How NFTs Work">
          <p>
            When a creator mints an NFT, a new entry is written to the blockchain containing
            a unique identifier, the owner&apos;s wallet address, and a link to the associated
            metadata — typically an image, video, audio file, or document stored on IPFS.
          </p>
          <p>
            Ownership is transferred by signing a blockchain transaction. The entire history
            of ownership — from the first mint to the most recent sale — is permanently recorded
            and publicly verifiable. No central authority controls this record.
          </p>
        </Section>

        <Section title="NFTs and Intellectual Property">
          <p>
            Traditionally, proving you created something required expensive legal processes —
            copyright registration, notarised documents, or contracts with distributors.
            NFTs provide a timestamped, immutable proof of creation that anyone can verify
            instantly, anywhere in the world.
          </p>
          <p>
            On Medialane, every NFT carries a programmable license embedded in its metadata.
            This license defines exactly how the work can be used: whether it can be reproduced,
            remixed, used commercially, or trained on by AI systems. These rules are enforced
            onchain and cannot be silently changed by a platform or middleman.
          </p>
        </Section>

        <Section title="Non-Fungibility Explained">
          <p>
            &ldquo;Fungible&rdquo; means interchangeable. A dollar bill is fungible — you can swap it
            for any other dollar bill and have the same value. Gold is fungible. Bitcoin is fungible.
          </p>
          <p>
            An NFT is <em>non</em>-fungible — each token has unique properties that make it
            distinct. Two NFTs from the same collection might look similar, but they have
            different token IDs, potentially different attributes, and separate ownership histories.
          </p>
        </Section>

        <Section title="NFTs on Starknet">
          <p>
            Medialane supports two NFT standards on Starknet, both anchored to Ethereum
            through Starknet&apos;s ZK-rollup architecture — meaning transactions are fast,
            cheap, and settled with Ethereum-level security.
          </p>
          <p>
            Every asset minted through Medialane is stored on IPFS for decentralised content
            availability, with the IPFS content identifier (CID) anchored to the NFT&apos;s
            onchain metadata. This ensures the artwork and license terms cannot be silently
            modified after minting.
          </p>
        </Section>

        <Section title="ERC-721 vs ERC-1155 — Two Token Standards">
          <p>
            Not all NFTs are the same kind of token. Medialane supports two standards,
            each suited to different use cases:
          </p>
          <div className="space-y-3">
            <div className="bento-cell px-4 py-3 space-y-1">
              <p className="text-sm font-semibold text-foreground">ERC-721 — Unique, one-of-one assets</p>
              <p className="text-xs">
                Each token ID has exactly one owner at a time. Transferring it passes full
                ownership. Ideal for original artworks, documents, patents, and any asset
                where uniqueness is the point. Medialane IP assets and collection registry
                NFTs use ERC-721 (SNIP-2 on Starknet).
              </p>
            </div>
            <div className="bento-cell px-4 py-3 space-y-1">
              <p className="text-sm font-semibold text-foreground">ERC-1155 — Multi-edition tokens</p>
              <p className="text-xs">
                A single token ID can be owned by many wallets simultaneously, each holding
                a quantity. Think of it like a limited print run — token ID #1 might have
                500 copies, with 500 different collectors each holding one. Collection Drops
                on Medialane use ERC-1155, allowing large releases where every minter
                receives the same edition token.
              </p>
            </div>
          </div>
          <p>
            Medialane automatically detects the standard of each collection using the
            ERC-165 <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">supportsInterface</code> call.
            The API returns <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">collection.standard</code>{" "}
            as <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">&quot;ERC721&quot;</code> or{" "}
            <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">&quot;ERC1155&quot;</code>, and{" "}
            <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">token.balances</code> on individual
            token fetches lists every current holder with their quantity — replacing the
            single <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">owner</code> field
            used for ERC-721.
          </p>
        </Section>

        <Section title="Common Questions">
          <p>
            <strong className="text-foreground">Does owning an NFT mean I own the copyright?</strong><br />
            Not automatically. The NFT represents ownership of the token, not necessarily
            the underlying intellectual property. On Medialane, creators explicitly define
            what rights transfer with the token through the programmable license.
          </p>
          <p>
            <strong className="text-foreground">Can NFTs be copied?</strong><br />
            The image or file can be copied — but the ownership record cannot. Anyone can
            screenshot the Mona Lisa, but the original hangs in the Louvre. The blockchain
            record of ownership is the authentic, provable original.
          </p>
          <p>
            <strong className="text-foreground">What happens if Medialane shuts down?</strong><br />
            Your NFTs are on the Starknet blockchain and stored on IPFS. They exist
            independently of Medialane. You control them through your wallet and can
            transfer, sell, or display them through any compatible platform.
          </p>
        </Section>
      </div>
    </div>
  );
}
