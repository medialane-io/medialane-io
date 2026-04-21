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
    <div className="space-y-10">
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
            A listing is an onchain intent signed with SNIP-12 typed data. Your asset
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

        <Section title="Buying Multi-Edition Assets (ERC-1155)">
          <p>
            Multi-edition IP assets — music tracks, art series, and other works deployed
            as ERC-1155 collections — support <strong className="text-foreground">partial fills</strong>.
            Instead of purchasing all available copies at once, you choose exactly how many
            editions you want.
          </p>
          <p>
            When you open the buy dialog on a multi-edition listing, a quantity selector
            appears showing the number of units still available. Adjust the quantity with
            the <strong className="text-foreground">−</strong> and <strong className="text-foreground">+</strong>{" "}
            buttons — the total price updates in real time. The order stays active on-chain
            after your purchase so other collectors can buy the remaining editions.
          </p>
          <p>
            The total you pay is always{" "}
            <strong className="text-foreground">price per unit × quantity</strong>, with
            ERC-2981 royalties applied to the full purchase value automatically.
          </p>
        </Section>

        <Section title="Offers (Bids)">
          <p>
            If an asset is not listed or you want to negotiate a price, you can make an
            offer. Navigate to the asset page and click <strong className="text-foreground">Make offer</strong>.
            Specify your bid amount — the offer is an onchain signed intent and the funds
            are not locked until the creator accepts.
          </p>
          <p>
            Creators receive notifications about incoming offers in their Portfolio under
            <strong className="text-foreground"> Offers received</strong>. Accepting an
            offer triggers an immediate onchain settlement.
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
            an onchain transaction that invalidates the signed intent. No funds are lost —
            cancellation is free of asset cost, though a small gas fee applies.
          </p>
        </Section>

        <Section title="Counter-Offers">
          <p>
            When you receive an offer on one of your assets, you can accept it, decline it,
            or send a <strong className="text-foreground">counter-offer</strong>. A counter-offer
            proposes a different price to the buyer — they can then accept, decline, or
            counter again. Counter-offers are managed from{" "}
            <strong className="text-foreground">Portfolio → Offers received</strong>.
          </p>
          <p>
            Like all orders, counter-offers are signed intents and do not lock any funds
            until accepted. Both parties can cancel at any time before acceptance.
          </p>
        </Section>

        <Section title="Supported Currencies">
          <p>
            The Medialane marketplace supports the following tokens on Starknet mainnet:
          </p>
          <ul className="list-disc list-inside space-y-1.5 text-sm">
            <li><strong className="text-foreground">STRK</strong> — Starknet&apos;s native token</li>
            <li><strong className="text-foreground">ETH</strong> — Bridged Ethereum</li>
            <li><strong className="text-foreground">USDC</strong> — USD Coin (Circle)</li>
            <li><strong className="text-foreground">USDT</strong> — Tether USD</li>
            <li><strong className="text-foreground">WBTC</strong> — Wrapped Bitcoin</li>
          </ul>
          <p>
            The currency filter in the marketplace lets you browse listings and offers
            by token. Price inputs are always in human-readable units — the protocol
            handles precision conversion automatically.
          </p>
        </Section>
      </div>
    </div>
  );
}
