import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Governance | Docs | Medialane",
  description: "Medialane DAO — governance charter, membership, voting, treasury, and the path to full community autonomy.",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h2 className="text-xl font-bold">{title}</h2>
      <div className="text-muted-foreground leading-relaxed space-y-3">{children}</div>
    </div>
  );
}

export default function DocsGovernancePage() {
  return (
    <div className="space-y-10">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Governance & DAO</h2>
        <p className="text-muted-foreground text-lg leading-relaxed">
          Medialane is building toward full community governance through the{" "}
          <strong className="text-foreground">Medialane DAO LLC</strong> — currently
          being incorporated in Utah, USA. This document describes the governance
          principles, membership structure, and the roadmap to decentralized autonomy.
        </p>
      </div>

      <div className="space-y-8">
        <Section title="The Mediolano Foundation">
          <p>
            Medialane is built on{" "}
            <strong className="text-foreground">Mediolano</strong> — a permissionless,
            open-source protocol for IP protection and licensing. Mediolano was designed
            as a <strong className="text-foreground">public good</strong>: zero fees,
            community-owned, and governed by its users through the Mediolano DAO.
          </p>
          <p>
            Medialane extends this foundation by adding a full marketplace, creator
            launchpad, and financial tools — while remaining anchored to Mediolano's
            integrity infrastructure. The philosophical commitment to creator sovereignty,
            transparent governance, and open protocols carries through from Mediolano
            into every part of Medialane.
          </p>
        </Section>

        <Section title="Medialane DAO LLC">
          <p>
            The <strong className="text-foreground">Medialane DAO LLC</strong> is being
            bootstrapped in Utah, USA, as the legal entity that will govern the platform.
            This structure is chosen deliberately — a DAO LLC provides:
          </p>
          <ul className="list-disc list-inside space-y-1.5 text-sm">
            <li>Legal recognition for the organization and its members</li>
            <li>Limited liability protection for DAO participants</li>
            <li>A bridge between on-chain governance and real-world legal obligations</li>
            <li>Ability to enter contracts, hold IP, and operate commercially</li>
          </ul>
          <p>
            The goal is a fully autonomous organization where creators, collectors, and
            developers collectively own and govern the platform through transparent
            on-chain processes.
          </p>
        </Section>

        <Section title="Mission & Values">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { title: "Sovereignty", desc: "Users own their data, their IP, and their assets. No platform extracting value without consent." },
              { title: "Transparency", desc: "All governance is open and verifiable. Smart contracts are the source of truth." },
              { title: "Innovation", desc: "Continuous protocol improvement, driven by the community rather than a central team." },
              { title: "Inclusivity", desc: "Anyone can participate — creators, collectors, developers, organizations, and AI agents." },
            ].map(({ title, desc }) => (
              <div key={title} className="bento-cell p-4 space-y-1.5">
                <p className="text-sm font-semibold text-foreground">{title}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Governance Structure">
          <p>
            Governance decisions follow a structured proposal lifecycle:
          </p>
          <div className="space-y-2">
            {[
              ["Discussion", "Community forums and calls where ideas are surfaced and refined before formal submission."],
              ["Proposal", "Formal on-chain proposal submission. Minimum token holding may be required."],
              ["Voting", "Token-weighted voting period. Quadratic or other mechanisms may be used to prevent plutocracy."],
              ["Execution", "Approved proposals are executed automatically via smart contract, or via timelocked governance actions."],
            ].map(([step, desc], i) => (
              <div key={step} className="bento-cell px-4 py-3 flex items-start gap-3">
                <span className="h-6 w-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <div>
                  <p className="text-sm font-semibold text-foreground">{step}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Treasury">
          <p>
            The Medialane DAO treasury receives a share of platform revenue. Funds are
            allocated by community governance to:
          </p>
          <ul className="list-disc list-inside space-y-1.5 text-sm">
            <li>Protocol development and maintenance</li>
            <li>Creator grants and ecosystem initiatives</li>
            <li>Marketing and community growth</li>
            <li>Contributor compensation</li>
            <li>Open-source tooling and public goods</li>
          </ul>
        </Section>

        <Section title="AI Agents as Participants">
          <p>
            Medialane and Mediolano are explicitly designed to support autonomous agents
            as first-class participants. AI entities with cryptographic identifiers and
            verifiable credentials can hold tokens, register IP, license content, and
            participate in governance — via delegated smart contracts or DAO-approved
            protocols.
          </p>
          <p>
            This is a deliberate philosophical commitment rooted in the Mediolano
            constitution: whether you are a human creator, an organization, or an
            autonomous intelligence, your contributions to the Integrity Web deserve
            recognition and protection.
          </p>
        </Section>

        <Section title="Public Goods Commitment">
          <p>
            The Mediolano protocol — the foundation Medialane is built upon — is{" "}
            <strong className="text-foreground">fully open source</strong> (MIT/GPL
            licensed) and operates as a digital public good. The entire codebase, from
            Cairo smart contracts to the indexer and frontend, is publicly verifiable.
          </p>
          <p>
            Surplus treasury funds, beyond what is required for protocol sustainability,
            may be used to fund public educational content, open-source tooling, community
            initiatives, and other public goods aligned with the DAO's values.
          </p>
        </Section>

        <Section title="Dispute Resolution">
          <p>
            Disputes involving platform conduct, IP infringement, or governance decisions
            are resolved through on-chain arbitration or DAO voting. The community has the
            ability to flag malicious actors, propose content delisting from the platform
            interface, and vote on enforcement actions.
          </p>
          <p>
            Note: on-chain records on Starknet are immutable and cannot be deleted by any
            party. Platform interface actions (such as delisting) affect visibility on
            Medialane.io but do not alter the underlying blockchain state.
          </p>
        </Section>

        <Section title="Get Involved">
          <p>
            The Medialane DAO is in active formation. Creators, developers, and
            community members are welcome to participate now:
          </p>
          <ul className="list-disc list-inside space-y-1.5 text-sm">
            <li>Follow <a href="https://x.com/medialane_io" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">@medialane_io</a> for governance announcements</li>
            <li>Reach out via <a href="mailto:dao@medialane.org" className="text-primary hover:underline">dao@medialane.org</a> to contribute or propose initiatives</li>
            <li>Join Telegram: <a href="https://t.me/IntegrityWeb" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">@IntegrityWeb</a></li>
          </ul>
        </Section>
      </div>
    </div>
  );
}
