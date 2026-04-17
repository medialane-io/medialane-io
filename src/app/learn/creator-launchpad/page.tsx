import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Creator Launchpad | Learn | Medialane",
  description: "Learn how to deploy collections, mint IP assets, and launch your creative work on Medialane.",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h2 className="text-xl font-bold">{title}</h2>
      <div className="text-muted-foreground leading-relaxed space-y-3">{children}</div>
    </div>
  );
}

export default function LearnCreatorLaunchpadPage() {
  return (
    <div className="space-y-10">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Creator Launchpad</h2>
        <p className="text-muted-foreground text-lg leading-relaxed">
          The Medialane Creator Launchpad lets you deploy your own NFT collection, mint
          individual IP assets, and bring your creative work onchain — without any coding
          or prior blockchain experience.
        </p>
      </div>

      <div className="space-y-8">
        <Section title="Step 1 — Create an Account">
          <p>
            Sign in with your email or social account via Clerk. Medialane automatically
            derives a Starknet wallet from your session — no seed phrases, no browser
            extensions required. Your wallet address is yours, derived deterministically
            from your authentication credentials.
          </p>
        </Section>

        <Section title="Step 2 — Deploy a Collection">
          <p>
            A collection is a smart contract on Starknet that groups related NFTs under
            a shared name, symbol, and identity. Think of it as your brand onchain —
            an art series, a music catalogue, a portfolio of photographs.
          </p>
          <p>
            Medialane supports two collection formats, each deployed from the Launchpad:
          </p>
          <div className="bento-cell px-4 py-3 space-y-1">
            <p className="text-sm font-semibold text-foreground">ERC-721 Collection</p>
            <p className="text-xs leading-relaxed">
              From <strong>Create → Collection</strong>, choose a name, symbol, and cover image.
              Medialane deploys an ERC-721 contract and registers it in the onchain registry.
              Each asset you mint into it will be a unique, 1-of-1 token with its own owner.
            </p>
          </div>
          <div className="bento-cell px-4 py-3 space-y-1">
            <p className="text-sm font-semibold text-foreground">IP Collection 1155 — Multi-Edition</p>
            <p className="text-xs leading-relaxed">
              From <strong>Launchpad → IP Collection 1155 → Create Collection</strong>, deploy an
              ERC-1155 contract for multi-edition releases. Once deployed, the collection appears
              in your Launchpad with a <em>Mint</em> button — mint new token editions directly
              into it, each with its own supply, metadata, and price. Best for music tracks,
              art series, or any creative work you want multiple people to own.
            </p>
          </div>
        </Section>

        <Section title="Step 3 — Mint an IP Asset">
          <p>
            From <strong className="text-foreground">Create → Asset</strong>, upload your
            file (image, audio, video, or document), fill in the title and description,
            select the collection, and define the programmable license terms:
          </p>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>License type (All Rights Reserved, Creative Commons, Custom)</li>
            <li>Commercial use permissions</li>
            <li>Derivative work rules</li>
            <li>AI training policy</li>
            <li>Geographic scope</li>
            <li>Royalty percentage on secondary sales</li>
          </ul>
          <p>
            Your file is uploaded to IPFS via Pinata, giving it a permanent content
            address. The metadata JSON — including your license terms — is also stored
            on IPFS and linked to the NFT onchain.
          </p>
        </Section>

        <Section title="Step 4 — List or Hold">
          <p>
            Once minted, your asset appears in your Portfolio. You can hold it as proof
            of ownership, list it for sale at a fixed price, or receive offers from
            interested collectors directly through the platform.
          </p>
          <p>
            Royalties you configure at mint time are enforced on every secondary sale —
            automatically and without relying on any marketplace to honour them.
          </p>
        </Section>

        <Section title="Gasless Minting">
          <p>
            Medialane uses ChipiPay&apos;s session key system to sponsor gas fees on your
            behalf. Most actions — minting, listing, accepting offers — require no ETH
            or STRK from the user. You interact with the blockchain the same way you&apos;d
            interact with any web application.
          </p>
        </Section>

        <Section title="Launchpad Services">
          <p>
            Beyond collections and individual assets, the Launchpad gives creators access
            to a growing suite of onchain tools:
          </p>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li><strong className="text-foreground">POP Protocol</strong> — Issue soulbound credentials for events, bootcamps, and milestones</li>
            <li><strong className="text-foreground">Collection Drop</strong> — Launch a fixed-supply ERC-721 drop with a timed mint window</li>
            <li><strong className="text-foreground">IP Collection 1155</strong> — Deploy a multi-edition ERC-1155 collection and mint token editions into it</li>
            <li><strong className="text-foreground">Remix</strong> — Create licensed derivative works with on-chain attribution back to the original</li>
          </ul>
          <p>
            All services are permissionless — no approval required. Your contract is
            deployed directly to Starknet mainnet, owned by your wallet.
          </p>
        </Section>
      </div>
    </div>
  );
}
