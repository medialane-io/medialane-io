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
    <div className="space-y-10 max-w-3xl">
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
            From the <strong className="text-foreground">Create → Collection</strong> page,
            choose a name, symbol, and upload a cover image. Medialane deploys the
            collection contract to Starknet mainnet and registers it in the platform&apos;s
            onchain registry so it appears in search and discovery.
          </p>
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

        <Section title="Launchpad Features">
          <p>
            The Launchpad section of Medialane features curated drops from verified
            creators. If your collection is ready for a wider audience, contact us to
            apply for a featured launch slot with dedicated promotion and early-access
            minting for the community.
          </p>
        </Section>
      </div>
    </div>
  );
}
