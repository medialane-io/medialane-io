import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Programmable Licensing | Learn | Medialane",
  description: "Explore Medialane's onchain licensing system — Creative Commons variants, AI policy, royalties, and derivative rules embedded in every NFT.",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h2 className="text-xl font-bold">{title}</h2>
      <div className="text-muted-foreground leading-relaxed space-y-3">{children}</div>
    </div>
  );
}

function LicenseRow({ name, description }: { name: string; description: string }) {
  return (
    <div className="bento-cell px-4 py-3 flex items-start gap-3">
      <span className="font-mono text-xs bg-primary/10 text-primary px-2 py-1 rounded-md shrink-0 mt-0.5">{name}</span>
      <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}

export default function LearnProgrammableLicensingPage() {
  return (
    <div className="space-y-10 max-w-3xl">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Programmable Licensing</h2>
        <p className="text-muted-foreground text-lg leading-relaxed">
          Every IP asset minted on Medialane carries a machine-readable license embedded
          in its on-chain metadata. Creators define the rules once — and they apply
          automatically to every holder, forever.
        </p>
      </div>

      <div className="space-y-8">
        <Section title="Why On-Chain Licensing?">
          <p>
            Traditional licensing requires negotiating and signing contracts with each
            individual user. This is impractical for digital content distributed at scale.
            Creative Commons solved part of this problem with standardised license text —
            but even CC licenses rely on platforms to honour them and provide no automatic
            enforcement.
          </p>
          <p>
            Medialane takes licensing further: the terms are embedded in the NFT&apos;s IPFS
            metadata as structured attributes, readable by any application, and linked
            permanently to the token. They travel with the asset through every transfer
            and are surfaced to every buyer in the marketplace UI.
          </p>
        </Section>

        <Section title="License Types">
          <div className="space-y-2">
            <LicenseRow name="ARR" description="All Rights Reserved — no use permitted beyond viewing. Full copyright retained by the creator." />
            <LicenseRow name="CC BY" description="Creative Commons Attribution — free to use, share, and adapt with credit to the original creator." />
            <LicenseRow name="CC BY-SA" description="Attribution + ShareAlike — derivatives must be licensed under the same terms." />
            <LicenseRow name="CC BY-NC" description="Attribution + NonCommercial — free for non-commercial use with credit." />
            <LicenseRow name="CC BY-NC-SA" description="Attribution + NonCommercial + ShareAlike — non-commercial use, same-license derivatives." />
            <LicenseRow name="CC BY-ND" description="Attribution + NoDerivatives — sharing permitted but no modifications allowed." />
            <LicenseRow name="CC0" description="Public Domain dedication — creator waives all rights. Anyone can use for any purpose." />
            <LicenseRow name="Custom" description="Creator-defined terms specified as freeform text alongside structured attributes." />
          </div>
        </Section>

        <Section title="Commercial Use">
          <p>
            Creators specify whether commercial use of their work is permitted. Options range
            from full commercial rights (any entity may use the work commercially) to
            personal-only (non-commercial individuals only) to no commercial use at all.
            This is surfaced as a discrete attribute on the asset page so buyers can
            understand what they are purchasing.
          </p>
        </Section>

        <Section title="Derivative Works">
          <p>
            The license specifies what buyers or licensees may do with the original work:
          </p>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li><strong className="text-foreground">Not allowed</strong> — the work may not be modified or adapted</li>
            <li><strong className="text-foreground">Allowed</strong> — derivatives are permitted under the same license</li>
            <li><strong className="text-foreground">Allowed with attribution</strong> — derivatives must credit the original creator</li>
            <li><strong className="text-foreground">Allowed, share-alike</strong> — derivatives must carry the same license terms</li>
          </ul>
        </Section>

        <Section title="AI Training Policy">
          <p>
            Medialane is one of the first platforms to include explicit AI policy as a
            structured license attribute. Creators choose from:
          </p>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li><strong className="text-foreground">Allowed</strong> — the work may be used to train AI models</li>
            <li><strong className="text-foreground">Not allowed</strong> — AI training use is explicitly prohibited</li>
            <li><strong className="text-foreground">With permission only</strong> — AI training requires prior written consent from the creator</li>
          </ul>
          <p>
            While enforcement of AI policy remains a legal grey area globally, the explicit
            declaration in machine-readable metadata creates a clear record of the creator&apos;s
            intent — relevant in any future legal or regulatory context.
          </p>
        </Section>

        <Section title="Geographic Scope">
          <p>
            Creators can restrict the geographic scope of their license — specifying whether
            rights apply worldwide, to specific regions, or excluding particular jurisdictions.
            This is particularly useful for works subject to local copyright restrictions or
            distribution agreements.
          </p>
        </Section>

        <Section title="Royalties">
          <p>
            At mint time, creators set a royalty percentage (0–100%) applied to every
            secondary sale on the Medialane marketplace. This is enforced by the marketplace
            smart contract, not by platform policy — meaning it cannot be bypassed by
            listing through a different interface that calls the same contract.
          </p>
          <p>
            Royalties are distributed instantly on transaction settlement, with no manual
            claim step required from the creator.
          </p>
        </Section>
      </div>
    </div>
  );
}
