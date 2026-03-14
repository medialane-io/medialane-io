import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Protect Your IP | Learn | Medialane",
  description: "Understand the Berne Convention, copyright principles, and how Medialane helps creators protect their intellectual property on-chain.",
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
          Your creative work is protected by international copyright law from the moment
          you create it. Medialane adds a permanent on-chain layer of proof that strengthens
          your rights and makes licensing enforceable at scale.
        </p>
      </div>

      <div className="space-y-8">
        <Section title="The Berne Convention">
          <p>
            The Berne Convention for the Protection of Literary and Artistic Works is the
            foundational international treaty for copyright. Adopted in 1886 and now ratified
            by over 180 countries, it establishes that copyright protection is automatic —
            no registration or formality is required.
          </p>
          <p>
            Under Berne, the moment you create an original work and fix it in a tangible
            form (write it down, record it, draw it, photograph it), you hold copyright.
            This right is personal, transferable, and enforceable across all member nations.
          </p>
        </Section>

        <Section title="What Copyright Protects">
          <p>Copyright covers a broad range of original creative works, including:</p>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>Literary works (novels, scripts, articles, code)</li>
            <li>Musical compositions and sound recordings</li>
            <li>Visual art, illustrations, photographs, and films</li>
            <li>Architectural works</li>
            <li>Software and digital media</li>
          </ul>
          <p>
            Copyright does <em>not</em> protect ideas, facts, or styles — only the specific
            expression of an idea fixed in a medium.
          </p>
        </Section>

        <Section title="The Problem with Digital IP">
          <p>
            The internet made copying trivial. A creator publishes a piece of music or
            artwork online and within hours it may appear on hundreds of platforms without
            attribution or compensation. Proving you were the original creator — and when
            you created it — requires timestamps, witnesses, or legal registration that
            most independent creators cannot afford.
          </p>
          <p>
            Traditional licensing is equally fragmented. Even if a creator issues a license,
            tracking who is using the work, in what context, and whether royalties are being
            paid requires lawyers, contracts, and enforcement — systems built for large
            corporations, not individual creators.
          </p>
        </Section>

        <Section title="How Medialane Strengthens Your Rights">
          <p>
            When you mint a work on Medialane, the blockchain provides a timestamped,
            immutable record of creation anchored to your wallet address. This record:
          </p>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>Proves the existence of your work at a specific point in time</li>
            <li>Links it permanently to your identity (wallet address)</li>
            <li>Embeds your license terms in the token metadata on IPFS</li>
            <li>Makes the provenance chain of every ownership transfer publicly verifiable</li>
          </ul>
          <p>
            This does not replace copyright — it complements it. The blockchain record
            serves as strong evidence of original authorship that can be referenced in
            any legal proceeding or rights dispute.
          </p>
        </Section>

        <Section title="On-Chain Licensing">
          <p>
            Beyond proof of creation, Medialane lets you attach a programmable license
            to every work at mint time. This license defines in machine-readable terms
            what others can and cannot do with your work — whether they can reproduce it,
            adapt it, use it commercially, or train AI models on it.
          </p>
          <p>
            These terms are embedded in the NFT metadata and stored permanently on IPFS.
            They cannot be modified by a platform, and they travel with the token through
            every ownership transfer. See the{" "}
            <a href="/learn/programmable-licensing" className="text-primary hover:underline">
              Programmable Licensing
            </a>{" "}
            section for details.
          </p>
        </Section>

        <Section title="Important Disclaimer">
          <p>
            Medialane is not a law firm and does not provide legal advice. Minting a work
            on Medialane does not constitute formal copyright registration in any
            jurisdiction. For critical IP matters — especially commercial licensing, disputes,
            or enforcement — consult a qualified intellectual property attorney.
          </p>
        </Section>
      </div>
    </div>
  );
}
