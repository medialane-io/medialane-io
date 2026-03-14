import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Marketplace | Learn | Medialane",
  description: "Learn how to list, buy, sell, and make offers on IP assets in the Medialane marketplace.",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h2 className="text-xl font-bold">{title}</h2>
      <div className="text-muted-foreground leading-relaxed space-y-3">{children}</div>
    </div>
  );
}

export default function LearnMarketplacePage() {
  return (
    <div className="space-y-10 max-w-3xl">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">The Medialane Marketplace</h2>
        <p className="text-muted-foreground text-lg leading-relaxed">
          The Medialane marketplace is a peer-to-peer trading environment for IP assets.
          Creators list their work, collectors make offers, and every transaction is
          settled on Starknet with royalties enforced automatically.
        </p>
      </div>

      <div className="space-y-8">
        <Section title="Listings (Fixed Price)">
          <p>
            To sell an asset at a fixed price, navigate to the asset page and click
            <strong className="text-foreground"> List for sale</strong>. Set your price
            in STRK or ETH, review the terms, and sign the listing with your session key.
            The listing is recorded on the Medialane smart contract and immediately
            visible to all buyers.
          </p>
          <p>
            A listing is an on-chain intent signed with SNIP-12 typed data. Your asset
            remains in your wallet until a buyer fulfils the order — Medialane never
            takes custody of your NFT.
          </p>
        </Section>

        <Section title="Buying an Asset">
          <p>
            Browse listings in the <strong className="text-foreground">Marketplace</strong>{" "}
            or on individual collection and asset pages. Click <strong className="text-foreground">Buy</strong>,
            confirm the price, and enter your session PIN. The transaction executes via
            ChipiPay — the NFT transfers to your wallet and the payment goes to the seller,
            with royalties automatically split to the original creator.
          </p>
          <p>
            You can also use the <strong className="text-foreground">Cart</strong> to queue
            multiple purchases and execute them in a single session, saving time and reducing
            the number of PIN entries required.
          </p>
        </Section>

        <Section title="Offers (Bids)">
          <p>
            If an asset is not listed or you want to negotiate a price, you can make an
            offer. Navigate to the asset page and click <strong className="text-foreground">Make offer</strong>.
            Specify your bid amount — the offer is an on-chain signed intent and the funds
            are not locked until the creator accepts.
          </p>
          <p>
            Creators receive notifications about incoming offers in their Portfolio under
            <strong className="text-foreground"> Offers received</strong>. Accepting an
            offer triggers an immediate on-chain settlement.
          </p>
        </Section>

        <Section title="Royalties">
          <p>
            Every asset on Medialane carries a royalty percentage set by the creator at
            mint time. On every secondary sale — whether through a fixed listing or an
            accepted offer — the royalty is split automatically by the marketplace contract
            without any manual action from the creator.
          </p>
          <p>
            This is enforced at the protocol level, not as a voluntary platform policy.
            Even if a buyer transfers the asset to another wallet and sells it there,
            the royalty logic is embedded in the order execution.
          </p>
        </Section>

        <Section title="Cancelling Orders">
          <p>
            Listings and offers can be cancelled at any time from the asset page or from
            your Portfolio under <strong className="text-foreground">Listings</strong> or
            <strong className="text-foreground"> Offers sent</strong>. Cancellation is
            an on-chain transaction that invalidates the signed intent. No funds are lost —
            cancellation is free of asset cost, though a small gas fee applies.
          </p>
        </Section>

        <Section title="Supported Currencies">
          <p>
            The Medialane marketplace currently supports <strong className="text-foreground">STRK</strong>{" "}
            and <strong className="text-foreground">ETH</strong> on Starknet mainnet.
            Additional currencies may be added through community governance in the future.
          </p>
        </Section>
      </div>
    </div>
  );
}
