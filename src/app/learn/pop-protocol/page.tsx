import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "POP Protocol | Learn | Medialane",
  description: "Learn how the POP Protocol issues on-chain proof-of-participation credentials for events, communities, and milestones.",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h2 className="text-xl font-bold">{title}</h2>
      <div className="text-muted-foreground leading-relaxed space-y-3">{children}</div>
    </div>
  );
}

export default function LearnPOPPage() {
  return (
    <div className="space-y-10 max-w-3xl">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">POP Protocol</h2>
        <p className="text-muted-foreground text-lg leading-relaxed">
          The POP Protocol (Proof of Participation) allows event organisers, communities,
          and platforms to issue verifiable on-chain credentials to participants — permanently
          anchored on Starknet.
        </p>
      </div>

      <div className="space-y-8">
        <Section title="What is a POP Credential?">
          <p>
            A POP credential is a <strong className="text-foreground">soulbound NFT</strong> — a
            non-transferable token that acts as a verifiable record of an event or achievement.
            Unlike regular NFTs, soulbound tokens cannot be sold or transferred. They are
            permanently associated with the wallet that claimed them.
          </p>
          <p>
            Examples of what a POP credential can represent:
          </p>
          <ul className="list-disc list-inside space-y-1.5 text-sm">
            <li>Attendance at a concert, conference, or community event</li>
            <li>Completion of an online course or challenge</li>
            <li>Membership in a DAO or creator collective</li>
            <li>Early supporter or beta tester status</li>
            <li>Achievement of a milestone (e.g., first sale, first 100 collectors)</li>
          </ul>
        </Section>

        <Section title="How It Works">
          <p>
            The POP Protocol has two roles: <strong className="text-foreground">Providers</strong> and{" "}
            <strong className="text-foreground">Participants</strong>.
          </p>
          <div className="space-y-3">
            <div className="bento-cell px-4 py-3 space-y-1">
              <p className="text-sm font-semibold text-foreground">Providers (Event Creators)</p>
              <p className="text-xs text-muted-foreground">
                Approved providers can create POP events. Each event has a name, description,
                image, and an optional claim window. Providers define who is eligible to claim
                — open events allow anyone with the link, while gated events require provider
                approval or an allowlist.
              </p>
            </div>
            <div className="bento-cell px-4 py-3 space-y-1">
              <p className="text-sm font-semibold text-foreground">Participants (Claimants)</p>
              <p className="text-xs text-muted-foreground">
                Any Medialane user can claim a POP credential for an active event they
                participated in. Claims are free (gas-sponsored) and completed in seconds.
                The credential appears immediately in the holder's wallet and portfolio.
              </p>
            </div>
          </div>
        </Section>

        <Section title="Claiming a POP Credential">
          <p>
            To claim a credential, navigate to the POP Protocol section under{" "}
            <strong className="text-foreground">Launchpad → POP Protocol</strong>. You will
            see a list of active events. Click <strong className="text-foreground">Claim</strong>{" "}
            on any event you participated in, confirm with your PIN, and the credential is
            minted to your wallet.
          </p>
          <p>
            Each credential can only be claimed once per wallet. Duplicate claims are
            rejected by the smart contract. There is no cost to claim — gas fees are
            sponsored by Medialane.
          </p>
        </Section>

        <Section title="Creating an Event (Providers Only)">
          <p>
            To create POP events, you must first apply to become an approved provider.
            Approved providers have access to the{" "}
            <strong className="text-foreground">Create Event</strong> button in the POP
            Protocol section. When creating an event you define:
          </p>
          <ul className="list-disc list-inside space-y-1.5 text-sm">
            <li>Event name and description</li>
            <li>Credential image (uploaded to IPFS)</li>
            <li>Claim window (start and end dates, or open-ended)</li>
            <li>Maximum number of credentials (optional cap)</li>
          </ul>
          <p>
            The event is deployed as a smart contract on Starknet. Each credential issued
            is a soulbound NFT under a unique on-chain collection associated with your event.
          </p>
        </Section>

        <Section title="Why On-Chain Credentials?">
          <p>
            Traditional credentials — conference badges, certificates, Discord roles — are
            controlled by the platform that issued them. If that platform disappears or
            revokes your access, the credential is gone. On-chain credentials are permanent
            and self-sovereign: they live in your wallet and cannot be taken away.
          </p>
          <p>
            POP credentials are publicly verifiable. Any application can query the Starknet
            blockchain (or the Medialane API) to confirm whether a wallet holds a specific
            credential — opening up token-gated experiences, DAO voting, and reputation
            systems built on trustless proof.
          </p>
        </Section>
      </div>
    </div>
  );
}
