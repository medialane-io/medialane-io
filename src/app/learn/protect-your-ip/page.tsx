import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Protect Your IP | Learn | Medialane",
  description: "Understand the Berne Convention, cryptographic IP protection, and how Medialane and the Mediolano protocol protect creators in 181 countries.",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h2 className="text-xl font-bold">{title}</h2>
      <div className="text-muted-foreground leading-relaxed space-y-3">{children}</div>
    </div>
  );
}

export default function LearnProtectIPPage() {
  return (
    <div className="space-y-10 max-w-3xl">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Protecting Your Intellectual Property</h2>
        <p className="text-muted-foreground text-lg leading-relaxed">
          Your creative work is automatically protected by international copyright law
          the moment you create it. Medialane — built on the Mediolano protocol —
          adds a permanent, cryptographic layer of proof that reinforces those rights
          across <strong className="text-foreground">181 countries</strong>, without
          registration, without lawyers, and without fees.
        </p>
      </div>

      <div className="space-y-8">

        <Section title="The Berne Convention (1886)">
          <p>
            The Berne Convention for the Protection of Literary and Artistic Works is
            the foundational international copyright treaty, administered by WIPO and
            ratified by <strong className="text-foreground">181 signatory countries</strong> —
            including virtually every WTO member via the TRIPS agreement.
          </p>
          <p>
            Its three core principles:
          </p>
          <div className="space-y-2">
            {[
              {
                name: "Automatic Protection",
                desc: "Copyright is granted the moment a work is fixed in a tangible medium. No registration, no formality, no fee required.",
              },
              {
                name: "National Treatment",
                desc: "Works from one member state must receive the same protection in all other member states as that country gives to its own creators.",
              },
              {
                name: "Independence of Protection",
                desc: "Rights are independent of protection in the country of origin. A work is protected even if it has no formal registration anywhere.",
              },
            ].map(({ name, desc }) => (
              <div key={name} className="bento-cell px-4 py-3 space-y-1">
                <p className="text-sm font-semibold text-foreground">{name}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
          <p>
            <strong className="text-foreground">Minimum standards</strong> under Berne:
            protection of literary, artistic, and scientific works; exclusive rights of
            reproduction and adaptation; moral rights (authorship and integrity); and a
            duration of at least the author's life plus 50 years (most countries extend
            this to 70 years).
          </p>
        </Section>

        <Section title="What Copyright Protects">
          <p>Copyright covers original creative works, including:</p>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>Music, sound recordings, and audio compositions</li>
            <li>Visual art, illustrations, photographs, and film</li>
            <li>Literary works — novels, scripts, articles, poetry</li>
            <li>Software and digital media</li>
            <li>AI-generated works where a human creator can be identified</li>
            <li>3D models, datasets, and digital-native formats</li>
          </ul>
          <p>
            Copyright does <em>not</em> protect ideas, facts, styles, or methods —
            only the specific expression fixed in a medium.
          </p>
        </Section>

        <Section title="The Problem with Digital IP">
          <p>
            The internet made copying trivial. A creator publishes music or artwork
            and within hours it may appear on hundreds of platforms — without attribution,
            without compensation, and with no practical way to prove original authorship.
          </p>
          <p>
            Traditional copyright enforcement requires timestamps, witnesses, or formal
            registration — expensive and inaccessible to most independent creators.
            And even with copyright established, licensing is fragmented: tracking who
            uses your work, in what context, and whether royalties are being paid
            requires lawyers and contracts built for large corporations.
          </p>
        </Section>

        <Section title="Cryptographic Protection via the Mediolano Protocol">
          <p>
            Medialane is built on the{" "}
            <strong className="text-foreground">Mediolano protocol</strong> — a
            permissionless, open-source IP protection infrastructure anchored to Starknet.
            When you mint a work on Medialane:
          </p>
          <ul className="list-disc list-inside space-y-1.5 text-sm">
            <li>An <strong className="text-foreground">immutable timestamped record</strong> is created on Starknet — permanent, public, undeniable proof of existence at a specific point in time.</li>
            <li>An <strong className="text-foreground">ERC-721 NFT</strong> is minted to your wallet — the token acts as the cryptographic key to your IP. Only the holder of the private key can manage, license, or transfer rights.</li>
            <li>Your <strong className="text-foreground">license terms</strong> are embedded in the token metadata and stored on IPFS — machine-readable, immutable, and accessible forever independently of the Medialane platform.</li>
            <li>A <strong className="text-foreground">content hash</strong> of the metadata is committed to the blockchain, linking the on-chain record to the off-chain content permanently.</li>
          </ul>
          <p>
            This creates a Berne Convention-compliant proof of authorship that is
            valid in 181 countries — without registration, without WIPO filing, and
            without any fee beyond standard Starknet gas (which is fractions of a cent).
          </p>
        </Section>

        <Section title="Decentralized & Censorship-Resistant">
          <p>
            Your IP record lives on Starknet and IPFS — not on Medialane's servers.
            This means:
          </p>
          <ul className="list-disc list-inside space-y-1.5 text-sm">
            <li><strong className="text-foreground">No vendor lock-in</strong> — your proof of ownership exists independently of the Medialane platform.</li>
            <li><strong className="text-foreground">No censorship</strong> — no central server can take down or alter your on-chain record.</li>
            <li><strong className="text-foreground">Perpetual access</strong> — IPFS ensures your metadata remains accessible for the lifetime of the network.</li>
            <li><strong className="text-foreground">Open source</strong> — the entire Mediolano protocol is publicly verifiable. No hidden backdoors.</li>
          </ul>
        </Section>

        <Section title="Community & DAO Protection">
          <p>
            Beyond cryptographic and legal protection, the Medialane community actively
            monitors for IP infringement. Through the DAO governance structure, community
            members can flag infringing content, propose delisting from the platform
            interface, and vote on enforcement actions.
          </p>
          <p>
            Note that on-chain records are immutable — delisting from the Medialane
            interface affects platform visibility but does not alter the underlying
            Starknet state. For DMCA takedown requests, contact{" "}
            <a href="mailto:dmca@medialane.io" className="text-primary hover:underline">
              dmca@medialane.io
            </a>.
          </p>
        </Section>

        <Section title="On-Chain Licensing">
          <p>
            Beyond proof of authorship, Medialane lets you attach programmable license
            terms to every work at mint time — defining in machine-readable form what
            others can and cannot do with your creation. License terms travel with the
            token through every transfer and are enforced by the marketplace smart contract
            on every sale.
          </p>
          <p>
            See the{" "}
            <Link href="/learn/programmable-licensing" className="text-primary hover:underline">
              Programmable Licensing
            </Link>{" "}
            guide for full details on license types, royalties, AI training policy, and
            derivative rules.
          </p>
        </Section>

        <Section title="Important Disclaimer">
          <p>
            Medialane is not a law firm and does not provide legal advice. Minting a
            work on Medialane does not constitute formal copyright registration in any
            jurisdiction. For critical IP matters — commercial licensing disputes,
            enforcement actions, or jurisdictions with registration requirements —
            consult a qualified intellectual property attorney.
          </p>
        </Section>
      </div>
    </div>
  );
}
